const GET = "GET";
const URL_TO_DB = "https://localhost:8080/waybill/";
const URL_TO_FILE = "https://localhost:8081/waybill/";
var HTTP_STATUS = {OK: 200, BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404};

const CLIENT_PICKUP_ROOM = "client_pickup_room" // kurier odbiera od klienta
const COURIER_PICKUP_ROOM = "courier_pickup_room" // kurier odbiera z paczkomatu
const CLIENT_DROP_ROOM = "client_drop_room" // klient zostawia w paczkomacie
const PLACE_FOR_MESSAGE_ID = "place_for_message"


document.addEventListener('DOMContentLoaded', function (event) {
    fillStatusFields();

    var ws_uri = "https://localhost:8084/"
    socket = io.connect(ws_uri);
    joinIntoRoom(COURIER_PICKUP_ROOM);
    joinIntoRoom(CLIENT_PICKUP_ROOM);
    

    socket.on("connect", function () {
        console.log("Correctly connected to the communication app");
    });

    socket.on("joined_room", function (message) {
        console.log("Joined to the room ", message);
    });

    socket.on("chat_message", function (data) {
        showUpdateAlert();
        console.log("Received new chat message:", data);
    });



    function joinIntoRoom(room_id) {
        socket.emit("join", { room_id: room_id });
    }



    function showSuccesMessage(newElemId, message, textBoxId) {
        let warningElem = prepareWarningElem(newElemId, message);
        warningElem.className = "success-field";
        appendAfterElem(textBoxId, warningElem);
    }

    function prepareWarningElem(newElemId, message) {
        let warningField = document.getElementById(newElemId);

        if (warningField === null) {
            let textMessage = document.createTextNode(message);
            warningField = document.createElement('span');

            warningField.setAttribute("id", newElemId);
            warningField.className = "warning-field";
            warningField.appendChild(textMessage);
        }
        return warningField;
    }

    function appendAfterElem(currentElemId, newElem) {
        let currentElem = document.getElementById(currentElemId);
        currentElem.insertAdjacentElement('afterend', newElem);
    }

    function showUpdateAlert() {
        let updateAlertInfo = "updateRequired"
        let updateAlertMessage = "Pojawiły się nowe pozycje na liście. Odśwież stronę."
        showSuccesMessage(updateAlertInfo, updateAlertMessage, PLACE_FOR_MESSAGE_ID)
    }
});


const fillStatusFields = async () => {
    for (i = 0; i < 5; i++) {
        statusField = document.getElementsByName("status")[i]
        if(statusField !== undefined) {
            hash_name = statusField.previousElementSibling.textContent
            let packageStatus = await fetchStatus(hash_name) 
            if (packageStatus === "oczekujaca_w_paczkomacie"){
                statusField.innerHTML = "oczekująca w paczkomacie"
            }
            else if (packageStatus === "przekazana_kurierowi") {
                statusField.innerHTML = "przekazana kurierowi"
            }
            else if (packageStatus === "odebrana" || packageStatus === "odebrana_z_paczkomatu"){
                statusField.innerHTML = "odebrana z paczkomatu"
            }
            else if (packageStatus === "nowa") {
                statusField.innerHTML = packageStatus
            }
            else {
                statusField.innerHTML = packageStatus
            }
        }
    }
}

const  fetchStatus = async (hash_name) => {
    let statusUrl = URL_TO_DB + "get_status/" + hash_name
    let reqestParams = {
        method: GET,
        redirect: "follow"
    };
    let res = await fetch (statusUrl, reqestParams);
    return await res.json();
}