
document.addEventListener('DOMContentLoaded', function (event) {

    const POST = "POST";
    const URL = "https://localhost:8083/";

    const PACKAGE_FIELD_ID = "token-id";
    const PACKAGE_BUTTON_ID = "button-token-form";
    var HTTP_STATUS = {OK: 200, CREATED: 201, BAD_REQUEST: 400, FORBIDDEN: 403, NOT_FOUND: 404};

    prepareEventOnIdChange();
    

    let packageForm = document.getElementById("token-form");
    let paczkomat_id = document.getElementById("paczkomat_id").value;

    packageForm.addEventListener("submit", function (event) {
        event.preventDefault();
        ifTokenOkShowPackages();
    });


    function prepareEventOnIdChange() {
        let idInput = document.getElementById(PACKAGE_FIELD_ID);
        idInput.addEventListener("change", updateTokenIdAvailabilityMessage);
    }
    

    const checkToken = async () => {
        let checkTokenUrl = URL + "check_token_" + paczkomat_id;

        let pickupParams = {
            method: POST,
            body: new FormData(packageForm),
            redirect: "follow"
        };

        let res = await fetch (checkTokenUrl, pickupParams);
        displayInConsoleCorrectResponse(res);
        return await res;

    }

    const ifTokenOkShowPackages = async() => {
        
        
        let warningTokenInfoElemId = "invalidToken";
        let warningMessage = "Nieprawidłowy token";
        if(isAnyEmptyImput()) {
            showWarningMessage(warningTokenInfoElemId, warningMessage, PACKAGE_FIELD_ID);
            return false;
        }
        removeWarningMessage(warningTokenInfoElemId);
        let validityWarningElemId = document.getElementById(warningTokenInfoElemId);
        
        if( validityWarningElemId === null) {
                try{
                    let res = await checkToken();
                    let token = document.getElementById(PACKAGE_FIELD_ID).value;
                    setTimeout(function(){
                        if (document.getElementById("validToken") !== null) {
                            window.location = "/show_packages_" + paczkomat_id + "_0_" + token;
                        }
                    }, 2000);
                } catch (err) {
                    console.log("Caught error: " + err);
                }
        } else {
            return false;
        }
    }

    function isAnyEmptyImput() {
        if(
            document.getElementById(PACKAGE_FIELD_ID).value === "" 
        ) {
            return true;
        } else {
            return false;
        }
    }

    function displayInConsoleCorrectResponse(correctResponse) {
        let status = correctResponse.status;
        let correctTokenInfo = "validToken";
        let sucessMessage = "Przyjęto token";
        let warningTokenInfo = "invalidToken";
        let warningMessage = "Nieprawidłowy token";
        let warningPackageTakenMessage = "Nieprawidłowy token"


        if (status === HTTP_STATUS.FORBIDDEN) {
            removeWarningMessage(correctTokenInfo);
            showWarningMessage(warningTokenInfo, warningPackageTakenMessage, PACKAGE_FIELD_ID)
        } else if (status !== HTTP_STATUS.OK) {
            removeWarningMessage(correctTokenInfo);
            showWarningMessage(warningTokenInfo, warningMessage, PACKAGE_FIELD_ID);
        }  else {
            removeWarningMessage(warningTokenInfo);
            showSuccesMessage(correctTokenInfo, sucessMessage, PACKAGE_BUTTON_ID);
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

    function isTokenIdValid() {
        let regExpression = /^[A-Za-z0-9]+$/;
        let token = document.getElementById(PACKAGE_FIELD_ID);
        if (token.value.match(regExpression) && token.value.length > 4) {
            return true;
        } else {
            return false;
        }
    }


    function updateTokenIdAvailabilityMessage() {
        let validityWarningElemId = "invalidTokenWarning";
        let wrongTokenFormatWarningMessage = "Token musi składać się z co najmniej 5 znaków i zawierać tylko litery i cyfry."
        if (isTokenIdValid() === true) {
            removeWarningMessage(validityWarningElemId);
        } else {
            showWarningMessage(validityWarningElemId, wrongTokenFormatWarningMessage, PACKAGE_FIELD_ID)
        }
    }

});