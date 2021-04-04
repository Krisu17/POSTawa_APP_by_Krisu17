const CLIENT_ADDED_WAYBILL_ROOM = "client_added_waybill_room"
const ADD_NEW_WAYBILL_FORM = "add_new_waybill_form"


document.addEventListener('DOMContentLoaded', function (event) {
    var ws_uri = "https://localhost:8084/"
    socket = io.connect(ws_uri);

    joinIntoRoom(CLIENT_ADDED_WAYBILL_ROOM);

    socket.on("connect", function () {
        console.log("Correctly connected to the communication app");
    });

    socket.on("joined_room", function (message) {
        console.log("Joined to the room ", message);
    });

    socket.on("chat_message", function (data) {
        console.log("Received new chat message:", data);
    });



    function joinIntoRoom(room_id) {
        socket.emit("join", { room_id: room_id });
    }


});


function sendMessageToRoom() {
    sendMessage(CLIENT_ADDED_WAYBILL_ROOM, "Została dodana nowa paczka. Odśwież stronę.")

}

function sendMessage(room_id, text) {
    data = { room_id: room_id, message: text };
    socket.emit("new_message", data);
}