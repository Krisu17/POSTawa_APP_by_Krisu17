
document.addEventListener('DOMContentLoaded', function (event) {

    const POST = "POST";
    const URL = "https://localhost:8083/";

    const PARCEL_FIELD_ID = "parcel-locker-id";
    const PACKAGE_FIELD_ID = "package-id";
    const PACKAGE_BUTTON_ID = "button-package-form";
    var HTTP_STATUS = { OK: 200, CREATED: 201, BAD_REQUEST: 400, FORBIDDEN: 403, NOT_FOUND: 404 };
    const CLIENT_DROP_ROOM = "client_drop_room" // klient zostawia w paczkomacie

    prepareEventOnIdChange();

    var ws_uri = "https://localhost:8084/"
    socket = io.connect(ws_uri);
    joinIntoRoom(CLIENT_DROP_ROOM);

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

    function sendMessage(room_id, text) {
        data = { room_id: room_id, message: text };
        socket.emit("new_message", data);
    }

    let packageForm = document.getElementById("package-form");

    packageForm.addEventListener("submit", function (event) {
        event.preventDefault();

        ifFormOkTryDropPackage();
    });


    function prepareEventOnIdChange() {
        let idInput = document.getElementById(PACKAGE_FIELD_ID);
        idInput.addEventListener("change", updatePackageIdAvailabilityMessage);
    }


    const tryDropPackage = async () => {
        let parcel_locker_id = document.getElementById(PARCEL_FIELD_ID).innerText
        let DropUrl = URL + "drop_" + parcel_locker_id;

        let DropParams = {
            method: POST,
            body: new FormData(packageForm),
            redirect: "follow"
        };

        let res = await fetch(DropUrl, DropParams);
        console.log(res.status)
        displayInConsoleCorrectResponse(res);
        return res;

    }


    const ifFormOkTryDropPackage = async () => {


        let warningDropInfoElemId = "unsuccessfulDrop";
        let warningMessage = "Nieprawidłowy identyfikator przesyłki.";
        if (isAnyEmptyImput()) {
            showWarningMessage(warningDropInfoElemId, warningMessage, PACKAGE_BUTTON_ID);
            return false;
        }

        removeWarningMessage(warningDropInfoElemId);
        let validityWarningElemId = document.getElementById("unsuccessfulDrop");

        if (validityWarningElemId === null) {
            try {
                let res = await tryDropPackage();
                if (document.getElementById("correctDrop") !== null) {
                    sendMessage(CLIENT_DROP_ROOM, "Paczka została poprawnie przekazana do paczkomatu.");
                    setTimeout(function () {
                        let correctDropInfo = "correctDrop";
                        removeWarningMessage(correctDropInfo);
                        clearInputField();
                    }, 2000);
                }
            } catch (err) {
                console.log("Caught error: " + err);
            }
        } else {
            return false;
        }
    }

    function isAnyEmptyImput() {
        if (
            document.getElementById(PACKAGE_FIELD_ID).value === ""
        ) {
            return true;
        } else {
            return false;
        }
    }

    function clearInputField() {
        document.getElementById(PACKAGE_FIELD_ID).value = ""
    }

    function displayInConsoleCorrectResponse(correctResponse) {
        let status = correctResponse.status;
        let correctDropInfo = "correctDrop";
        let sucessMessage = "Przyjęto nadanie paczki.";
        let warningDropInfo = "unsuccessfulDrop";
        let warningMessage = "Nieprawidłowy identyfikator paczki";
        let warningPackageTakenMessage = "Paczka została już odebrana."


        if (status === HTTP_STATUS.FORBIDDEN) {
            removeWarningMessage(correctDropInfo);
            showWarningMessage(warningDropInfo, warningPackageTakenMessage, PACKAGE_FIELD_ID)
        } else if (status !== HTTP_STATUS.CREATED) {
            removeWarningMessage(correctDropInfo);
            showWarningMessage(warningDropInfo, warningMessage, PACKAGE_FIELD_ID);
        } else {
            removeWarningMessage(warningDropInfo);
            showSuccesMessage(correctDropInfo, sucessMessage, PACKAGE_BUTTON_ID);
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

    function isPackageIdValid() {
        let regExpression = /^[A-Za-z0-9]+$/;
        let package_id = document.getElementById(PACKAGE_FIELD_ID);
        if (package_id.value.match(regExpression) && package_id.value.length > 4) {
            return true;
        } else {
            return false;
        }
    }


    function updatePackageIdAvailabilityMessage() {
        let validityWarningElemId = "validDropWarning";
        let wrongPackageIdFormatWarningMessage = "Identyfikator musi składać się z co najmniej 5 znaków i zawierać tylko litery i cyfry."
        if (isPackageIdValid() === true) {
            removeWarningMessage(validityWarningElemId);
        } else {
            showWarningMessage(validityWarningElemId, wrongPackageIdFormatWarningMessage, PACKAGE_FIELD_ID)
        }
    }

});