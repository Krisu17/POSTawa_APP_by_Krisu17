from flask import Flask, render_template, send_file, request, jsonify, redirect, url_for, make_response, abort
import logging
from flask_jwt_extended import (JWTManager, create_access_token, jwt_required, get_jwt_identity)
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
KURIER_SESSION_ID = "kurier-session-id"
users = "users"
PACZKOMATY = ["p1", "p2"]
TOKEN_DURATION_TIME = 60
ITEMS_ON_PAGE = 5
APP_URL = "https://localhost:8082/"
RESPONSE_URL = APP_URL + "show_packages_"


app = Flask(__name__, static_url_path="")
app.secret_key = SECRET_KEY
db = redis.Redis(host="redis", port=6379, decode_responses=True)

app.config["JWT_SECRET_KEY"] = os.environ.get(SECRET_KEY)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = TOKEN_EXPIRES_IN_SECONDS
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_SECURE"] = True


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
    isValidCookie = user is not None
    if isValidCookie:
        response = make_response(render_template("kurier-index.html", isValidCookie = isValidCookie))
        return refresh_token_session(response, request.cookies);
    else:
        return redirect("/login")
    

#Ukryty adres rejstracji nowego kuriera
@app.route("/register", methods=[GET])
def register():
    user = getUserFromCookie();
    isValidCookie = user is not None
    response = make_response(render_template("kurier-register.html", isValidCookie = isValidCookie))
    return refresh_token_session(response, request.cookies);

@app.route("/register_kurier_oauth", methods=[GET])
def register_kurier_via_oauth():
    return auth0.authorize_redirect(
        redirect_uri=OAUTH_CALLBACK_URL_REGISTER_COURIER,
        audience="")


@app.route("/login", methods=[GET])
def login():
    user = getUserFromCookie();
    isValidCookie = user is not None
    response = make_response(render_template("kurier-login.html", isValidCookie = isValidCookie))
    return refresh_token_session(response, request.cookies);


@app.route("/login_kurier_oauth", methods=[GET])
def login_kurier_via_oauth():
    return auth0.authorize_redirect(
        redirect_uri=OAUTH_CALLBACK_URL_LOGIN_COURIER,
        audience="")

@app.route("/pickup", methods=[POST])
def pickup():
    user = getUserFromCookie() 
    isValidCookie = user is not None
    if isValidCookie:
        form = request.form
        userWaybillList = user + "-packages"
        package_id = form.get("package-id")
        package_status = db.hget(package_id, "status")
        if (package_status is None):
            return("Taka paczka nie istnieje", 400)
        if (package_status != "nowa"):
            return("Paczka została już odebrana", 403)
        db.hset(userWaybillList, package_id, "")
        db.hset(package_id, "status", "przekazana_kurierowi")
        response = make_response("Status changed", 201)
        return refresh_token_session(response, request.cookies);
    else:
        return abort(401)


@app.route("/show_packages_<int:start>", methods=[GET])
def show_packages(start):
    user = getUserFromCookie()
    isValidCookie = user is not None
    if isValidCookie:
        userWaybillList = user + "-packages"
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
            response = make_response(render_template("kurier-packages.html", isValidCookie = isValidCookie, my_files = my_files, prev_start = prev_start, next_start = next_start))
            return refresh_token_session(response, request.cookies);
        else:
            abort(400)
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


@app.route("/register_courier/<string:new_user>")
def is_login_taken(new_user):
    empty = {}
    dbResponse = db.hgetall(new_user)
    if dbResponse == empty:
        return {"message": "User don't exist"}, 404
    else:
        return {"message": "Username already taken"}, 200



@app.route("/register/create_new_courier/<string:new_user>", methods=[POST])
def create_new_courier(new_user):
    login = request.form['login'] + "_kurier"
    password = request.form['password']
    if(
        db.hset(login, "password", password) != 1 or
        db.hset(login, "oauthUser", "False") != 1
    ):
        db.hdel(login, "password", "oauthUser");
        return {"message": "Something went wrong while adding new user"}, 400
    else:
        return {"message": "User created succesfully"}, 201


@app.route("/login_kurier", methods=[POST])
def login_kurier():
    login = request.form['login'] + "_kurier"
    password = request.form['password']
    
    if (db.hget(login, "password") == password):
        name_hash = hashlib.sha512(login.encode("utf-8")).hexdigest()
        db.set(name_hash, login);
        db.expire(name_hash, TOKEN_EXPIRES_IN_SECONDS);
        userWaybillList = login + "-packages"
        access_token = create_access_token(identity=login, user_claims=db.hgetall(userWaybillList));
        response = make_response(jsonify({"access_token": access_token}), 200)
        
        response.set_cookie(KURIER_SESSION_ID, name_hash, max_age=TOKEN_EXPIRES_IN_SECONDS, secure=True, httponly=True)
        return response
    else:
        return {"message": "Login or password incorrect."}, 400

@app.route("/callback_register")
def oauth_callback_register():
    try:
        auth0.authorize_access_token()
        resp = auth0.get("userinfo")
        login = resp.json()[NICKNAME] + "_kurier"
        dbResponse = db.hgetall(login)
        if(dbResponse == ""):
            if( db.hset(login, "oauthUser", "True") != 1):
                db.hdel(login, "oauthUser");
                return abort(400)
        name_hash = hashlib.sha512(login.encode("utf-8")).hexdigest()
        db.set(name_hash, login);
        db.expire(name_hash, TOKEN_EXPIRES_IN_SECONDS);
        userWaybillList = login + "-packages"
        access_token = create_access_token(identity=login, user_claims=db.hgetall(userWaybillList));
        response = make_response(jsonify({"access_token": access_token}), 200)
        response = redirect(APP_URL)
        response.set_cookie(KURIER_SESSION_ID, name_hash, max_age=TOKEN_EXPIRES_IN_SECONDS, secure=True, httponly=True)
        return response
    except Exception as e:
        app.logger.debug(e)
        abort(400)

@app.route("/callback_login")
def oauth_callback_login():
    try:
        auth0.authorize_access_token()
        resp = auth0.get("userinfo")
        login = resp.json()[NICKNAME] + "_kurier"
        dbResponse = db.hgetall(login)
        if(dbResponse == ""):
                return abort(400)
        name_hash = hashlib.sha512(login.encode("utf-8")).hexdigest()
        db.set(name_hash, login);
        db.expire(name_hash, TOKEN_EXPIRES_IN_SECONDS);
        userWaybillList = login + "-packages"
        access_token = create_access_token(identity=login, user_claims=db.hgetall(userWaybillList));
        response = make_response(jsonify({"access_token": access_token}), 200)
        response = redirect(APP_URL)
        response.set_cookie(KURIER_SESSION_ID, name_hash, max_age=TOKEN_EXPIRES_IN_SECONDS, secure=True, httponly=True)
        return response
    except Exception as e:
        app.logger.debug(e)
        return {"message": "Something went wrong while trying to log in user"}, 400

def refresh_token_session(response, cookies):
    sessionId = cookies.get(KURIER_SESSION_ID);
    if (db.exists(str(sessionId))):
        db.expire(sessionId, TOKEN_EXPIRES_IN_SECONDS)
        response.set_cookie(KURIER_SESSION_ID, sessionId, max_age=TOKEN_EXPIRES_IN_SECONDS, secure=True, httponly=True)
    return response

@app.route('/register/user_data/<string:user>')
def getUser(user):
    return db.hgetall(user)

@app.route("/client_pickup")
def clientPickup():
    user = getUserFromCookie();
    isValidCookie = user is not None
    if isValidCookie:
        response = make_response(render_template("kurier-client-pickup.html", isValidCookie = isValidCookie))
        return refresh_token_session(response, request.cookies);
    else:
        return redirect("/login")

@app.route("/parcel_pickup")
def parcel_pickup():
    user = getUserFromCookie();
    isValidCookie = user is not None
    if isValidCookie:
        response = make_response(render_template("kurier-generate-token.html", isValidCookie = isValidCookie))
        return refresh_token_session(response, request.cookies);
    else:
        return redirect("/login")


@app.route("/generate_token/<string:p_id>", methods=[POST])
def generate_token(p_id):
    user = getUserFromCookie();
    isValidCookie = user is not None
    if isValidCookie:
        if(p_id in PACZKOMATY):
            token = uuid.uuid4().hex
            user_tag = "-user"
            db.set(token, p_id)
            db.set(token + user_tag, user)
            return make_response(jsonify(token=token), 201)
        else:
            return make_response("Invalid paczkomat id", 400)
    else:
        return make_response("Unauthorized", 403)




def getUserFromCookie():
    name_hash = request.cookies.get(KURIER_SESSION_ID)
    if name_hash is not None:
        login = db.get(name_hash);
        return login;
    return name_hash;

def removeCookies():
    sessionId = request.cookies.get(KURIER_SESSION_ID)
    if db.exists(sessionId):
        db.delete(sessionId);
        response = make_response(jsonify({"message": "OK"}), 200)
    else:
        response = make_response(jsonify({"message": "User is not logged"}), 204)
    response.set_cookie(KURIER_SESSION_ID, sessionId, max_age=0, secure=True, httponly=True)
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
