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


GET = "GET"
POST = "POST"
KURIER_SESSION_ID = "kurier-session-id"
users = "users"
ITEMS_ON_PAGE = 5
APP_URL = "https://localhost:8083/"
RESPONSE_URL = APP_URL + "show_packages_"
PACZKOMATY = ["p1", "p2"]


app = Flask(__name__, static_url_path="")
db = redis.Redis(host="redis", port=6379, decode_responses=True)
log = app.logger

app.config["JWT_SECRET_KEY"] = os.environ.get(SECRET_KEY)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = TOKEN_EXPIRES_IN_SECONDS
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_SECURE"] = True


jwt = JWTManager(app)
cors = CORS(app)


@app.route("/", methods=[GET])
def index():
    return make_response(render_template("paczkomat-index.html"))

@app.route("/parcel_homepage_<string:p_id>", methods=[GET])
def homepage(p_id):
    return make_response(render_template("paczkomat-homepage.html", p_id = p_id))
    

@app.route("/login", methods=[GET])
def login():
    user = getUserFromCookie();
    isValidCookie = user is not None
    response = make_response(render_template("kurier-login.html", isValidCookie = isValidCookie))
    return refresh_token_session(response, request.cookies);


@app.route("/drop_<string:p_id>", methods=[POST])
def drop(p_id):

    form = request.form
    package_id = form.get("package-id")
    package_status = db.hget(package_id, "status")
    paczkomat_packages = 1
    if (package_status is None):
        return("Taka paczka nie istnieje", 400)
    if (package_status != "nowa"):
        return("Paczka została już nadana", 403)
    db.hset(p_id, package_id, "")
    db.hset(package_id, "status", "oczekujaca_w_paczkomacie")
    return make_response("Status changed", 201)


@app.route("/show_packages_<string:p_id>_<int:start>_<string:token>", methods=[GET])
def show_packages(p_id, start, token):
    user_tag = "-user"
    correctPID = db.get(token)
    correctUser = db.get(token + user_tag)
    if (correctPID is None or correctUser is None or correctPID != p_id):
        abort(400)
    my_packages = db.hgetall(p_id);
    waybills_list = list(my_packages)
    if (start >= 0):
        number_of_waybills = len(waybills_list)
        end = start + ITEMS_ON_PAGE
        if (end >= number_of_waybills):
            end = number_of_waybills
            next_start = None
        else:
            next_start = RESPONSE_URL + p_id + "_" + str(end) + "?" + token
        prev_start_number = start - ITEMS_ON_PAGE
        if (prev_start_number < 0):
            prev_start = None
        else:
            prev_start = RESPONSE_URL + p_id + "_" + str(prev_start_number)  + "?" + token
        my_packages = waybills_list[start:end]
        return make_response(render_template("paczkomat-packages.html", my_packages = my_packages, prev_start = prev_start, next_start = next_start, p_id = p_id, token = token, user = correctUser));
    else:
        abort(400)

@app.route("/courier_pickup_<string:p_id>")
def courier_pickup(p_id):
    return render_template("paczkomat-courier-pickup.html", p_id = p_id)

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



@app.route("/pickup_from_<string:p_id>/<string:token>/<string:kurier>", methods=[POST])
def pickup_from(p_id, token, kurier):
    try:
        if(p_id not in PACZKOMATY):
            return make_response("Bad request", 400)
        if(kurier is not None):
            kurier_packages = kurier + "-packages"
            packages = db.hkeys(p_id)
            for hash_name in packages:
                if (hash_name in request.json):
                        wynik = db.hset(kurier_packages, hash_name, "")
                        db.hdel(p_id, hash_name)
                        db.hset(hash_name, "status", "odebrana")
            return make_response("OK", 200)
        else:
            return make_response("Unauthorized", 401)
    except Exception as e:
        app.logger.debug(e)

def refresh_token_session(response, cookies):
    sessionId = cookies.get(KURIER_SESSION_ID);
    if (db.exists(str(sessionId))):
        db.expire(sessionId, TOKEN_EXPIRES_IN_SECONDS)
        response.set_cookie(KURIER_SESSION_ID, sessionId, max_age=TOKEN_EXPIRES_IN_SECONDS, secure=True, httponly=True)
    return response


@app.route("/client_drop_<string:p_id>")
def client_drop(p_id):
    return make_response(render_template("paczkomat-client-drop.html", p_id = p_id))

@app.route("/check_token_<string:p_id>", methods=[POST])
def check_token(p_id):
    token = request.form["token-id"]
    correct_p_id = db.get(token)
    user_tag = "-user"
    correct_user = db.get(token + user_tag)
    if (correct_p_id is None or correct_user is None or correct_p_id != p_id):
        return make_response("Invalid paczkomat id", 400)
    return make_response("Correct token", 200)

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
