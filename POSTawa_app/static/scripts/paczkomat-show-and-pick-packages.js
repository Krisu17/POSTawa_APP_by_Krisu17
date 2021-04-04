const GET = "GET";
const URL_TO_DB = "https://localhost:8080/waybill/";
const URL_TO_FILE = "https://localhost:8081/waybill/";
const URL = "https://localhost:8083/"
const POST = "POST";
var HTTP_STATUS = {OK: 200, BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404};

const CLIENT_PICKUP_ROOM = "client_pickup_room" // kurier odbiera od klienta
const COURIER_PICKUP_ROOM = "courier_pickup_room" // kurier odbiera z paczkomatu
const CLIENT_DROP_ROOM = "client_drop_room" // klient zostawia w paczkomacie
const PICKUP_BUTTON_ID = "pickup_button_id"
const PLACE_FOR_MESSAGE_ID = "place_for_message"


document.addEventListener('DOMContentLoaded', function (event) {
    fillStatusFields();
    var ws_uri = "https://localhost:8084/"
    socket = io.connect(ws_uri);
    joinIntoRoom(COURIER_PICKUP_ROOM);
    joinIntoRoom(CLIENT_DROP_ROOM);
    

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

    function sendMessage(room_id, text) {
        data = { room_id: room_id, message: text };
        socket.emit("new_message", data);
    }

    let submitButton = document.getElementById("pickup_button_id");
    submitButton.addEventListener("click", function (event) {
        event.preventDefault();
        tryPickUpPackages();
    });

    const tryPickUpPackages = async () => {
        let idList = []
        for (i = 0; i < 5; i++) {
            checkbox = document.getElementsByName("checkboxes")[i]
            if(checkbox !== undefined) {
                isChecked = checkbox.checked;
                if(isChecked) {
                    idList.push(checkbox.id)
                }
            }
        }

        let warningPickupId = "invalidForm";
        let warningMessage = "Aby odebrać, musi być zaznaczona co najmniej jedna przesyłka."

        if (idList.length === 0) {
            showWarningMessage(warningPickupId, warningMessage, PLACE_FOR_MESSAGE_ID);
            return false;
        }

        removeWarningMessage(warningPickupId);
        try{
            let res = await trySendRequest(idList);
            if(document.getElementById("correctPickup") !== null) {
                sendMessage(COURIER_PICKUP_ROOM, "Paczki zostały odebrane przez kuriera.");
                removePickedPackages(idList);
            }
        } catch (err) {

            console.log("Caught error: " + err);
        }

    }

    const trySendRequest = async (idList) => {
        let p_id = document.getElementById("paczkomat_id").value;
        let token = document.getElementById("kurier_token").value;
        let kurier = document.getElementById("kurier_login").value;

        let requestUrl = URL + "pickup_from_" + p_id + "/" + token + "/" + kurier;


        let requestParams = {
            method: POST,
            headers: {
                'Content-Type': 'application/json',
              },
            body: JSON.stringify(idList),
            redirect: "follow"
        };

        let res = await fetch (requestUrl, requestParams);
        displayInConsoleCorrectResponse(res);
        return await res;
    }

    function removePickedPackages(idList) {
        // while((id = idList.pop()) !== null) {
        //     elem = document.getElementById(id);
        //     if (elem !== null) {
        //         elem.remove();
        //     }
        // }
    }

    function displayInConsoleCorrectResponse(correctResponse) {
        let status = correctResponse.status;
        console.log("status " + status)
        let correctLoginInfo = "correctPickup";
        let sucessMessage = "Paczki zostały odebrane pomyślnie";
        let warningLoginInfo = "invalidForm";
        let warningMessage = "Nie udało się odebrać paczek.";

        if (status !== HTTP_STATUS.OK) {
            removeWarningMessage(correctLoginInfo);
            showWarningMessage(warningLoginInfo, warningMessage, PLACE_FOR_MESSAGE_ID);
        } else {
            removeWarningMessage(warningLoginInfo);
            showSuccesMessage(correctLoginInfo, sucessMessage, PLACE_FOR_MESSAGE_ID);
        }
    }

    function showWarningMessage(newElemId, message, textBoxId) {
        let warningElem = prepareWarningElem(newElemId, message);
        appendAfterElem(textBoxId, warningElem);
    }

    function showSuccesMessage(newElemId, message, textBoxId) {
        let warningElem = prepareWarningElem(newElemId, message);
        warningElem.className = "success-field";
        appendAfterElem(textBoxId, warningElem);
    }

    function removeWarningMessage(warningElemId) {
        let warningElem = document.getElementById(warningElemId);

        if (warningElem !== null) {
            warningElem.remove();
        }
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
        let updateAlertMessage = "Zaszły zmiany. Odśwież stronę."
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
            else if (packageStatus === "odebrana" || packageStatus === "nowa") {
                statusField.innerHTML = packageStatus
            }
            else {
                statusField.innerHTML = "status nieznany"
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