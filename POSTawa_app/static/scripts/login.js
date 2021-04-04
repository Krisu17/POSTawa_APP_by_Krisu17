
document.addEventListener('DOMContentLoaded', function (event) {

    const GET = "GET";
    const POST = "POST";
    const URL = "https://localhost:8080/";

    const LOGIN_FIELD_ID = "login";
    const PASSWORD_FIELD_ID = "password";
    const LOGIN_BUTTON_ID = "button-log-form"
    var HTTP_STATUS = {OK: 200, NOT_FOUND: 404};

    prepareEventOnLoginChange();
    prepareEventOnPasswordChange();

    let loginForm = document.getElementById("login-form");

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        ifFormOkTryLogIn();
    });


    function prepareEventOnLoginChange() {
        let loginInput = document.getElementById(LOGIN_FIELD_ID);
        loginInput.addEventListener("change", updateLoginAvailabilityMessage);
    }
    
    function prepareEventOnPasswordChange() {
        let passwordInput = document.getElementById(PASSWORD_FIELD_ID);
        passwordInput.addEventListener("change", updatePasswordValidityMessage);
    }

    const tryLogIn = async () => {
        let loginUrl = URL + "login_user";

        let loginParams = {
            method: POST,
            body: new FormData(loginForm),
            redirect: "follow"
        };

        let res = await fetch (loginUrl, loginParams);
        displayInConsoleCorrectResponse(res);
        return await res.json();

    }


    const ifFormOkTryLogIn = async() => {
        
        
        
        let warningLoginInfoElemId = "unsuccessfulLogin";
        let warningMessage = "Nieprawidłowy login lub hasło.";
        if(isAnyEmptyImput()) {
            showWarningMessage(warningLoginInfoElemId, warningMessage, LOGIN_BUTTON_ID);
            return false;
        }

        removeWarningMessage(warningLoginInfoElemId);
        let validityWarningElemId = document.getElementById("unsuccessfulLogin");
        let passwordWarningElemId = document.getElementById("passwordWarning");
        
        if( validityWarningElemId === null &&
            passwordWarningElemId === null) {
                try{
                    let res = await tryLogIn();
                    let login = document.getElementById(LOGIN_FIELD_ID).value;
                    window.localStorage.setItem("access_token", res.access_token);
                    setTimeout(function(){
                        if (document.getElementById("correctLogin") !== null) {
                             window.location = "/";
                        }
                    }, 1000);
                } catch (err) {
                    console.log("Caught error: " + err);
                }
        } else {
            return false;
        }
    }

    function isAnyEmptyImput() {
        if(
            document.getElementById(LOGIN_FIELD_ID).value === "" ||
            document.getElementById(PASSWORD_FIELD_ID).value === "" 
        ) {
            return true;
        } else {
            return false;
        }
    }

    function displayInConsoleCorrectResponse(correctResponse) {
        let status = correctResponse.status;
        console.log("status " + status)
        let correctLoginInfo = "correctLogin";
        let sucessMessage = "Użytkownik został zalogowany pomyślnie. Za chwilę nastąpi przekierowanie.";
        let warningLoginInfo = "unsuccessfulLogin";
        let warningMessage = "Nieprawidłowy login lub hasło.";

        if (status !== HTTP_STATUS.OK) {
            removeWarningMessage(correctLoginInfo);
            showWarningMessage(warningLoginInfo, warningMessage, LOGIN_BUTTON_ID);
        } else {
            removeWarningMessage(warningLoginInfo);
            showSuccesMessage(correctLoginInfo, sucessMessage, LOGIN_BUTTON_ID);
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

    function isLoginValid() {
        let regExpression = /^[A-Za-z]+$/;
        let login = document.getElementById(LOGIN_FIELD_ID);
        if (login.value.match(regExpression) && login.value.length > 4) {
            return true;
        } else {
            return false;
        }
    }

    function isPasswordValid() {
        let regExpression = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#\$%\^&\*]).{8,}$/;
        let password = document.getElementById(PASSWORD_FIELD_ID);
        if (password.value.match(regExpression)) {
            return true;
        } else {
            return false;
        }
    }

    function updatePasswordValidityMessage() {
        let warningElemId = "passwordWarning";
        let warningMessage = "Co najmniej 8 znaków, mała i duża litera oraz znak specjalny.";

        if (isPasswordValid() === true) {
            removeWarningMessage(warningElemId);
        } else {
            showWarningMessage(warningElemId, warningMessage, PASSWORD_FIELD_ID);
        }
    }

    function updateLoginAvailabilityMessage() {
        let validityWarningElemId = "validLoginWarning";
        let wrongLoginFormatWarningMessage = "Login musi składać się z 5 znaków i zawierać tylko litery."
        if (isLoginValid() === true) {
            removeWarningMessage(validityWarningElemId);
        } else {
            showWarningMessage(validityWarningElemId, wrongLoginFormatWarningMessage, LOGIN_FIELD_ID)
        }
    }

});