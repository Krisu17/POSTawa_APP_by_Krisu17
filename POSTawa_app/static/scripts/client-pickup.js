
document.addEventListener('DOMContentLoaded', function (event) {

    const POST = "POST";
    const URL = "https://localhost:8082/";

    const PACKAGE_FIELD_ID = "package-id";
    const PACKAGE_BUTTON_ID = "button-package-form";
    var HTTP_STATUS = { OK: 200, CREATED: 201, BAD_REQUEST: 400, FORBIDDEN: 403, NOT_FOUND: 404 };
    const CLIENT_PICKUP_ROOM = "client_pickup_room" // kurier odbiera od klienta

    prepareEventOnIdChange();

    var ws_uri = "https://localhost:8084/"
    socket = io.connect(ws_uri);
    joinIntoRoom(CLIENT_PICKUP_ROOM);

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

        ifFormOkTryPickupPackage();
    });


    function prepareEventOnIdChange() {
        let idInput = document.getElementById(PACKAGE_FIELD_ID);
        idInput.addEventListener("change", updatePackageIdAvailabilityMessage);
    }


    const tryPickupPackage = async () => {
        let pickupUrl = URL + "pickup";

        let pickupParams = {
            method: POST,
            body: new FormData(packageForm),
            redirect: "follow"
        };

        let res = await fetch(pickupUrl, pickupParams);
        displayInConsoleCorrectResponse(res);
        return res;

    }


    const ifFormOkTryPickupPackage = async () => {


        let warningPickupInfoElemId = "unsuccessfulPickup";
        let warningMessage = "Nieprawidłowy identyfikator przesyłki.";
        if (isAnyEmptyImput()) {
            showWarningMessage(warningPickupInfoElemId, warningMessage, PACKAGE_BUTTON_ID);
            return false;
        }

        removeWarningMessage(warningPickupInfoElemId);
        let validityWarningElemId = document.getElementById("unsuccessfulPickup");

        if (validityWarningElemId === null) {
            try {
                let res = await tryPickupPackage();
                if (document.getElementById("correctPickup") !== null) {
                    sendMessage(CLIENT_PICKUP_ROOM, "Paczka została poprawnie odebrana przez kuriera.");
                    setTimeout(function () {
                        let correctPickupInfo = "correctPickup";
                        removeWarningMessage(correctPickupInfo);
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
        let correctPickupInfo = "correctPickup";
        let sucessMessage = "Przyjęto odbiór paczki.";
        let warningPickupInfo = "unsuccessfulPickup";
        let warningMessage = "Nieprawidłowy identyfikator paczki";
        let warningPackageTakenMessage = "Paczka została już odebrana."


        if (status === HTTP_STATUS.FORBIDDEN) {
            removeWarningMessage(correctPickupInfo);
            showWarningMessage(warningPickupInfo, warningPackageTakenMessage, PACKAGE_FIELD_ID)
        } else if (status !== HTTP_STATUS.CREATED) {
            removeWarningMessage(correctPickupInfo);
            showWarningMessage(warningPickupInfo, warningMessage, PACKAGE_FIELD_ID);
        } else {
            removeWarningMessage(warningPickupInfo);
            showSuccesMessage(correctPickupInfo, sucessMessage, PACKAGE_BUTTON_ID);
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
        let validityWarningElemId = "validPickupWarning";
        let wrongPackageIdFormatWarningMessage = "Identyfikator musi składać się z co najmniej 5 znaków i zawierać tylko litery i cyfry."
        if (isPackageIdValid() === true) {
            removeWarningMessage(validityWarningElemId);
        } else {
            showWarningMessage(validityWarningElemId, wrongPackageIdFormatWarningMessage, PACKAGE_FIELD_ID)
        }
    }

});