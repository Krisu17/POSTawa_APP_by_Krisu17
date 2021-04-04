
document.addEventListener('DOMContentLoaded', function (event) {

    const POST = "POST";
    const URL = "https://localhost:8082/";

    const PACZKOMAT_FIELD_ID = "paczkomat-id";
    const TOKEN_BUTTON_ID = "button-token-form";
    var HTTP_STATUS = {OK: 200, CREATED: 201, BAD_REQUEST: 400, FORBIDDEN: 403, NOT_FOUND: 404};


    let tokenForm = document.getElementById("token-form");
    let idInput = document.getElementById(PACZKOMAT_FIELD_ID);

    tokenForm.addEventListener("submit", function (event) {
        event.preventDefault();
        console.log(idInput.value)
        ifFormOkTryGenerateToken();
    });


 
    

    const tryGenerateToken = async () => {
        let tokenUrl = URL + "generate_token/" + idInput.value;

        let tokenParams = {
            method: POST,
            body: new FormData(tokenForm),
            redirect: "follow"
        };

        let res = await fetch (tokenUrl, tokenParams);
        displayInConsoleCorrectResponse(res);
        return res.json();

    }


    const ifFormOkTryGenerateToken = async() => {
        
        
        let warningGenerationInfoElemId = "unsuccessfulGeneration";
        let warningMessage = "Dostepne na razie nazwy paczkomatów to p1 i p2.";
        if(isAnyEmptyImput()) {
            showWarningMessage(warningGenerationInfoElemId, warningMessage, TOKEN_BUTTON_ID);
            return false;
        } 
        removeWarningMessage(warningGenerationInfoElemId);
        let validityWarningElemId = document.getElementById("unsuccessfulGeneration");
        
        if( validityWarningElemId === null) {
                try{
                    let res = await tryGenerateToken();
                    document.getElementById("generate_token_results").innerHTML = res["token"]
                    setTimeout(function(){
                        if (document.getElementById("correctGeneration") !== null) {
                            let correctGenerationInfo = "correctGeneration";
                            removeWarningMessage(correctGenerationInfo);
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
            document.getElementById(PACZKOMAT_FIELD_ID).value === "" 
        ) {
            return true;
        } else {
            return false;
        }
    }

    function displayInConsoleCorrectResponse(correctResponse) {
        let status = correctResponse.status;
        let correctGenerationInfo = "correctGeneration";
        let sucessMessage = "Wygenerowano poprawnie token.";
        let warningGenerationInfo = "unsuccessfulGeneration";
        let warningMessage = "Błąd. Prosze zalogować się jeszcze raz.";
        let warningPackageTokenMessage = "Błąd. Prosze zalogować się jeszcze raz."


        if (status === HTTP_STATUS.FORBIDDEN) {
            removeWarningMessage(correctGenerationInfo);
            showWarningMessage(warningGenerationInfo, warningPackageTokenMessage, PACZKOMAT_FIELD_ID)
        } else if (status !== HTTP_STATUS.CREATED) {
            removeWarningMessage(correctGenerationInfo);
            showWarningMessage(warningGenerationInfo, warningMessage, PACZKOMAT_FIELD_ID);
        }  else {
            removeWarningMessage(warningGenerationInfo);
            showSuccesMessage(correctGenerationInfo, sucessMessage, PACZKOMAT_FIELD_ID);
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



});