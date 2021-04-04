from flask import Flask, render_template, send_file, request, jsonify, redirect, url_for, make_response, abort
import logging
from flask_jwt_extended import (JWTManager, create_access_token, jwt_required, get_jwt_identity, set_access_cookies)
from const import *
import redis
import os
from flask_cors import CORS, cross_origin
import uuid
import hashlib
from datetime import datetime
from authlib.integrations.flask_client import OAuth
from functools import wraps
from const_config import *


GET = "GET"
POST = "POST"
USER_SESSION_ID = "session_id"
JWT_SESSION_COOKIE = "access_token_cookie"
users = "users"

FILES_PATH = "waybill_files/"
IMAGES_PATH = "waybill_files/images"
ACCEPTED_IMAGE_EXTENSIONS = ["png", "jpeg", "jpg"]
ITEMS_ON_PAGE = 5
APP_URL = "https://localhost:8080/"
RESPONSE_URL = APP_URL + "show_waybills_"

app = Flask(__name__, static_url_path="")
app.secret_key = os.environ.get("LOGIN_JWT_SECRET")
log = app.logger

db = redis.Redis(host="redis", port=6379, decode_responses=True)
db.delete("sessions")
db.delete("jwts")


app.config["JWT_SECRET_KEY"] = os.environ.get("LOGIN_JWT_SECRET")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = TOKEN_EXPIRES_IN_SECONDS
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
# app.config["JWT_COOKIE_SECURE"] = True


jwt = JWTManager(app)
cors = CORS(app)
oauth = OAuth(app)

auth0 = oauth.register(
    "ped-auth0-2021",
    api_base_url=OAUTH_BASE_URL,
    client_id=OAUTH_CLIENT_ID,
    client_secret=OAUTH_CLIENT_SECRET,
    access_token_url=OAUTH_ACCESS_TOKEN_URL,
    authorize_url=OAUTH_AUTHORIZE_URL,
    client_kwargs={"scope": OAUTH_SCOPE})



@app.route("/", methods=[GET])
def index():
    user = getUserFromCookie();
    app.logger.debug(user)
    isValidCookie = user is not None
    response = make_response(render_template("client-index.html", isValidCookie = isValidCookie))
    return refresh_token_session(response, request.cookies);
    

@app.route("/register", methods=[GET])
def register():
    user = getUserFromCookie();
    isValidCookie = user is not None
    response = make_response(render_template("client-register.html", isValidCookie = isValidCookie))
    return refresh_token_session(response, request.cookies);

@app.route("/login", methods=[GET])
def login():
    user = getUserFromCookie();
    isValidCookie = user is not None
    response = make_response(render_template("client-login.html", isValidCookie = isValidCookie))
    return refresh_token_session(response, request.cookies);

@app.route("/login_oauth2")
def login_oauth2():
    return auth0.authorize_redirect(
        redirect_uri=OAUTH_CALLBACK_URL,
        audience="")

@app.route("/callback")
def oauth_callback():
    try:
        auth0.authorize_access_token()
        resp = auth0.get("userinfo")
        login = resp.json()[NICKNAME]
        dbResponse = db.hgetall(login)
        if(dbResponse == ""):
            if( db.hset(login, "oauthUser", "True") != 1):
                db.hdel(login, "oauthUser");
                return abort(400)
        session_id = hashlib.sha512(login.encode("utf-8")).hexdigest()
        access_token = create_access_token(identity=login)
        db.hset("sessions", session_id, login)
        db.hset("jwts", access_token, login)
        access_token = create_access_token(identity=login)
        response = redirect(APP_URL)
        response.set_cookie(USER_SESSION_ID, session_id, max_age=TOKEN_EXPIRES_IN_SECONDS, secure=True, httponly=True)
        set_access_cookies(response, access_token, TOKEN_EXPIRES_IN_SECONDS)
        return response
    except Exception as e:
        app.logger.debug(e)
        return abort(400)

@app.route("/add_waybill", methods=[GET])
def add_waybill():
    user = getUserFromCookie();
    isValidCookie = user is not None
    if isValidCookie:
        response = make_response(render_template("client-add-waybill.html", isValidCookie = isValidCookie))
        return refresh_token_session(response, request.cookies);
    else:
        return abort(401)

@app.route("/add_waybill/new", methods=[POST])
def add_waybill_new():
    login = getUserFromCookie();
    isValidCookie = login is not None
    if isValidCookie:
        form = request.form
        userWaybillList = login + "-waybills"
        addTime = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        package_id = uuid.uuid4().hex.encode("utf-8")
        filePath = FILES_PATH + package_id.decode("utf-8") + ".pdf"

        db.hset(userWaybillList, package_id, addTime)

        db.hset(package_id, "sender_name", form.get("sender_name"));
        db.hset(package_id, "sender_surname", form.get("sender_surname"));
        db.hset(package_id, "sender_street", form.get("sender_street"));
        db.hset(package_id, "sender_city", form.get("sender_city"));
        db.hset(package_id, "sender_postal", form.get("sender_postal"));
        db.hset(package_id, "sender_country", form.get("sender_country"));
        db.hset(package_id, "sender_phone", form.get("sender_phone"));

        db.hset(package_id, "recipient_name", form.get("recipient_name"));
        db.hset(package_id, "recipient_surname", form.get("recipient_surname"));
        db.hset(package_id, "recipient_street", form.get("recipient_street"));
        db.hset(package_id, "recipient_city", form.get("recipient_city"));
        db.hset(package_id, "recipient_postal", form.get("recipient_postal"));
        db.hset(package_id, "recipient_country", form.get("recipient_country"));
        db.hset(package_id, "recipient_phone", form.get("recipient_phone"));

        db.hset(package_id, "creation_time", addTime)
        db.hset(package_id, "status", "nowa")
        db.hset(package_id, "filePath", filePath)

        pathToImage = save_file(package_id, request.files["waybill_image"])
        db.hset(package_id, "waybill_image", pathToImage)

        response = make_response(redirect("/show_waybills_0"))
        return refresh_token_session(response, request.cookies);
    else:
        return make_response("Użytkownik niezalogowany", 401)

@app.route("/waybill/rm/<string:waybill_hash>", methods=["DELETE"])
def remove_waybill(waybill_hash):
    login = getUserFromCookie();
    isValidCookie = login is not None
    if isValidCookie:
        userWaybillList = login + "-waybills"
        filePath = db.hget(waybill_hash, "waybill_image")
        if(db.hget(waybill_hash, "status") != "nowa"):
            return make_response("Paczka została już odebrana", 403)
        if os.path.exists(filePath):
            os.remove(filePath)
        if(db.hdel(waybill_hash, "sender_name", "sender_surname", "sender_street", "sender_city", "sender_postal", "sender_country", "sender_phone", "recipient_name", "recipient_surname", "recipient_street", "recipient_city", "recipient_postal", "recipient_country", "recipient_phone", "creation_time", "status", "waybill_image") != 17):
            return make_response("Podczas usuwania wystąpił błąd", 400)
        if(db.hdel(userWaybillList, waybill_hash) != 1):
            return make_response("Podczas usuwania wystąpił błąd", 400)
        return make_response("Deleted", 200)
    else:
        return make_response("Użytkownik niezalogowany", 401)

@app.route("/waybill/get_status/<string:waybill_hash>", methods=[GET])
def get_status(waybill_hash):
    return make_response(jsonify(db.hget(waybill_hash, "status")), 200)


@app.route("/waybill/get_date/<string:waybill_hash>", methods=[GET])
def get_date(waybill_hash):
    return make_response(jsonify(db.hget(waybill_hash, "creation_time")), 200)


@app.route("/show_waybills_<int:start>", methods=[GET])
def show_waybills(start):
    user = getUserFromCookie();
    isValidCookie = user is not None
    if isValidCookie:
        userWaybillList = user + "-waybills"
        waybills = db.hgetall(userWaybillList);
        waybills_list = list(waybills)
        if (start >= 0):
            number_of_waybills = len(waybills_list)
            end = start + ITEMS_ON_PAGE
            if (end >= number_of_waybills):
                end = number_of_waybills
                next_start = None
            else:
                next_start = RESPONSE_URL + str(end)
            prev_start_number = start - ITEMS_ON_PAGE
            if (prev_start_number < 0):
                prev_start = None
            else:
                prev_start = RESPONSE_URL + str(prev_start_number)
            my_files = waybills_list[start:end]
            response = make_response(render_template("client-show-waybills.html", isValidCookie = isValidCookie, my_files = my_files, prev_start = prev_start, next_start = next_start, number_of_waybills = number_of_waybills))
            return refresh_token_session(response, request.cookies);
        else:
            return abort(400)
    else:
        return abort(401)


@app.route("/logout")
def logout():
    user = getUserFromCookie();
    isValidCookie = user is not None
    if isValidCookie:
        isOauthUser = db.hget(user, "oauthUser")
        if(isOauthUser == "True"):
            url_params = "returnTo=" + url_for("/", _external=True)
            url_params += "&"
            url_params += "client_id=" + OAUTH_CLIENT_ID
            response = removeCookies()
            return redirect(auth0.api_base_url + "/v2/logout?" + url_params)
        else:
            response = removeCookies()
    return redirect("/")


@app.route("/register/<string:new_user>")
def is_login_taken(new_user):
    empty = {}
    dbResponse = db.hgetall(new_user)
    if dbResponse == empty:
        return {"message": "User don't exist"}, 404
    else:
        return {"message": "Username already taken"}, 200



@app.route("/register/create_new_user/<string:new_user>", methods=[POST])
def create_new_user(new_user):
    name = request.form['name']
    surname = request.form['surname']
    birthDate = request.form['birthDate']
    street = request.form['street']
    adressNumber = request.form['adressNumber']
    postalCode = request.form['postalCode']
    country = request.form['country']
    login = request.form['login']
    pesel = request.form['pesel']
    password = request.form['password']
    if(
        db.hset(login, "name", name) != 1 or
        db.hset(login, "surname", surname) != 1 or
        db.hset(login, "birthDate", birthDate) != 1 or
        db.hset(login, "street", street) != 1 or
        db.hset(login, "adressNumber", adressNumber) != 1 or
        db.hset(login, "postalCode", postalCode) != 1 or
        db.hset(login, "country", country) != 1 or
        db.hset(login, "pesel", pesel) != 1 or
        db.hset(login, "password", password) != 1 or
        db.hset(login, "oauthUser", "False") != 1
    ):
        db.hdel(login, "name", "surname", "birthDate", "street", "adressNumber", "postalCode", "country", "pesel", "password", "oauthUser");
        return {"message": "Something went wrong while adding new user"}, 400
    else:
        return {"message": "User created succesfully"}, 201


@app.route("/login_user", methods=[POST])
def log_user():
    try:
        login = request.form['login']
        password = request.form['password']
        
        if (db.hget(login, "password") == password):
            session_id = hashlib.sha512(login.encode("utf-8")).hexdigest()
            access_token = create_access_token(identity=login)
            db.hset("sessions", session_id, login)
            db.hset("jwts", access_token, login)
            access_token = create_access_token(identity=login)
            response = make_response(jsonify({"access_token": access_token}), 200)
            response.set_cookie(USER_SESSION_ID, session_id, max_age=TOKEN_EXPIRES_IN_SECONDS, secure=True, httponly=True)
            set_access_cookies(response, access_token, TOKEN_EXPIRES_IN_SECONDS)
            return response
        else:
            return {"message": "Login or password incorrect."}, 400
    except Exception as e:
        app.logger.debug(e)
        return abort(400)


def refresh_token_session(response, cookies):
    sessionIdHash = cookies.get(USER_SESSION_ID)
    if sessionIdHash is not None:
        if(db.hexists("sessions", sessionIdHash)):
            login = db.hget("sessions", sessionIdHash)
            if login is not None:
                db.hdel("sessions", sessionIdHash)
                db.hdel("jwts", sessionIdHash)
                session_id = hashlib.sha512(login.encode("utf-8")).hexdigest()
                access_token = create_access_token(identity=login)
                db.hset("sessions", session_id, login)
                db.hset("jwts", access_token, login)
                response.set_cookie(USER_SESSION_ID, session_id, max_age=TOKEN_EXPIRES_IN_SECONDS, secure=True, httponly=True)
                set_access_cookies(response, access_token, TOKEN_EXPIRES_IN_SECONDS)
    return response


def getUserFromCookie():
    sessionIdHash = request.cookies.get(USER_SESSION_ID)
    if sessionIdHash is not None:
        login = db.hget("sessions", sessionIdHash)
        return login
    return sessionIdHash

def removeCookies():
    sessionIdHash = request.cookies.get(USER_SESSION_ID)
    sessionJWT = request.cookies.get(JWT_SESSION_COOKIE)
    if db.hexists("sessions", sessionIdHash):
        db.hdel("sessions", sessionIdHash)
        if db.hexists("jwts", sessionIdHash):
            db.hdel("jwts", sessionIdHash)
            response = make_response(jsonify({"message": "OK"}), 200)
        else:
            response = make_response(jsonify({"message": "User is not logged"}), 204)
    else:
        response = make_response(jsonify({"message": "User is not logged"}), 204)
    if sessionIdHash is not None:
        response.set_cookie(USER_SESSION_ID, sessionIdHash, max_age=0, secure=True, httponly=True)
    if sessionJWT is not None:
        set_access_cookies(response, sessionJWT, 0)
    return response


def save_file(id, image):
    if image is not None:
        fileExtension = image.filename.split('.')[-1]
        if fileExtension not in ACCEPTED_IMAGE_EXTENSIONS:
            return ""
        else:
            image_name = "{}.{}".format(id, fileExtension)
            image_path = os.path.join(IMAGES_PATH, image_name)
            image.save(image_path)
            return image_path
    else:
        return ""


@app.errorhandler(400)
def bad_request(error):
    response = make_response(render_template("errors/400.html", error=error))
    return response

@app.errorhandler(401)
def unauthorized(error):
    response = make_response(render_template("errors/401.html", error=error))
    return response

@app.errorhandler(403)
def forbidden(error):
    response = make_response(render_template("errors/403.html", error=error))
    return response

@app.errorhandler(404)
def page_not_found(error):
    response = make_response(render_template("errors/404.html", error=error))
    return response

@app.errorhandler(500)
def internal_server_error(error):
    response = make_response(render_template("errors/500.html", error=error))
    return response
