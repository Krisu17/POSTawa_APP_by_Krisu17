from flask import Flask, render_template
from flask_socketio import SocketIO, join_room, leave_room, emit, send

app = Flask(__name__, static_url_path="")
socket_io = SocketIO(app, cors_allowed_origins="*")

ROOM_ID = "room_id"
MESSAGE = "message"


@app.route("/")
def index():
    return render_template("communicator_app.html")


@socket_io.on("connect")
def handle_on_connect():
    app.logger.debug("Connected -> OK")
    emit("connection response", {"data": "Correctly connected"})


@socket_io.on("disconnect")
def handle_on_disconnect():
    app.logger.debug("Disconnected -> Bye")


@socket_io.on("join")
def handle_on_join(data):
    room_id = data[ROOM_ID]
    join_room(room_id)
    emit("joined_room", {"room_id": room_id})
    app.logger.debug("Useragent added to the room: %s" %
                     (room_id))


@socket_io.on("leave")
def handle_on_leave(data):
    room_id = data[ROOM_ID]
    leave_room(room_id)
    app.logger.debug("Useragent is no longer in the room: %s" %
                     (room_id))


@socket_io.on("new_message")
def handle_new_message(data):
    app.logger.debug(f"Received data: {data}.")
    emit("chat_message", {MESSAGE: data[MESSAGE]}, room=data[ROOM_ID])


@socket_io.on("new_global_message")
def handle_new_global_message(data):
    app.logger.debug(f"Received global message data: {data}.")
    emit("chat_global_message", {MESSAGE: data[MESSAGE]})
