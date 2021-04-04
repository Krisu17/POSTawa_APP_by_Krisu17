from flask import Flask, render_template, send_file, request, jsonify, redirect, url_for, abort, make_response
import logging
from const import *
from flask_jwt_extended import (JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt_claims)
import redis
import os
import json
from flask_cors import CORS, cross_origin
import uuid
from model.waybill import *
from datetime import datetime

app = Flask(__name__, static_url_path="")
db = redis.Redis(host="redis", port=6379, decode_responses=True)
log = app.logger
app.secret_key = SECRET_KEY
cors = CORS(app)

FILES_PATH = "waybill_files/"
PATH_AND_FILENAME = "path_and_filename"
IMAGES_PATH = "waybill_files/images"
FILENAMES = "filenames"

app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_SECRET_KEY"] = os.environ.get(SECRET_KEY)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = TOKEN_EXPIRES_IN_SECONDS
ACCEPTED_IMAGE_EXTENSIONS = ["png", "jpeg", "jpg"]

jwt = JWTManager(app)



@app.before_first_request
def setup():
    log.setLevel(logging.DEBUG)


@app.route("/")
def index():
    return render_template("files-index.html")



@cross_origin(origins=["https://localhost:8080/"], supports_credentials=True)
@app.route("/waybill/<string:waybill_hash>", methods=[GET])
@jwt_required
def download_waybill(waybill_hash):
    try:
        if (db.hexists(waybill_hash, "filePath")):
            filename = waybill_hash + ".pdf"
            file_path = os.path.join(FILES_PATH, filename)
            if(not os.path.isfile(file_path)):
                waybill = to_waybill(waybill_hash)
                file_path = waybill.generate_and_save(FILES_PATH)
            return send_file(file_path)
        return abort(400)
    except Exception as e:
        app.logger.debug(e)
        return abort(400)

@cross_origin(origins=["https://localhost:8080/"], supports_credentials=True)
@app.route("/waybill/rm/<string:waybill_hash>", methods=["OPTIONS"])
@jwt_required
def remove_waybill_options(waybill_hash):
    return make_response("OK", 200)

@cross_origin(origins=["https://localhost:8080/"], supports_credentials=True)
@app.route("/waybill/rm/<string:waybill_hash>", methods=["DELETE"])
@jwt_required
def remove_waybill(waybill_hash):
    if(db.hget(waybill_hash,"status") != "nowa"):
        abort(403)
    filename = waybill_hash + ".pdf"
    file_path = os.path.join(FILES_PATH, filename)

    if os.path.exists(file_path):
        os.remove(file_path)
    response = make_response("Deleted", 200)
    # response.headers['Access-Control-Allow-Origin'] = '*'
    # response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response
    

def to_waybill(waybill_hash):
    sender = to_sender(waybill_hash)
    recipient = to_recipient(waybill_hash)

    return Waybill(sender, recipient, db.hget(waybill_hash, "creation_time"), waybill_hash, db.hget(waybill_hash, "waybill_image"))


def to_sender(waybill_hash):
    name = db.hget(waybill_hash,"sender_name")
    surname = db.hget(waybill_hash,"sender_surname")
    street = db.hget(waybill_hash,"sender_street")
    city = db.hget(waybill_hash,"sender_city")
    postal = db.hget(waybill_hash,"sender_postal")
    country = db.hget(waybill_hash,"sender_country")
    phone = db.hget(waybill_hash, "sender_phone")
    
    address = Address(street, city, postal, country)
    return Person(name, surname, phone, address)


def to_recipient(waybill_hash):
    name = db.hget(waybill_hash,"recipient_name")
    surname = db.hget(waybill_hash,"recipient_surname")
    street = db.hget(waybill_hash,"recipient_street")
    city = db.hget(waybill_hash,"recipient_city")
    postal = db.hget(waybill_hash,"recipient_postal")
    country = db.hget(waybill_hash,"recipient_country")
    phone = db.hget(waybill_hash, "recipient_phone")

    address = Address(street, city, postal, country)
    return Person(name, surname, phone, address)


def save_waybill(waybill):
    fullname = waybill.generate_and_save(FILES_PATH)
    filename = os.path.basename(fullname)

    db.hset(filename, PATH_AND_FILENAME, fullname)
    db.hset(FILENAMES, fullname, filename)

    log.debug("Saved waybill [fullname: {}, filename: {}].".format(fullname, filename))


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


