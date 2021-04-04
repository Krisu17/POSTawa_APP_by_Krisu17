document.addEventListener('DOMContentLoaded', function (event) {

    const GET = "GET";
    const POST = "POST";
    const URL = "https://localhost:8080/";

    const NAME_FIELD_ID = "name";
    const SURNAME_FIELD_ID = "surname";
    const BIRTH_DATE_FIELD_ID = "birthDate";
    const STREET_FIELD_ID = "street";
    const ADRESS_NUMBER_FIELD_ID = "adressNumber";
    const POSTAL_CODE_FIELD_ID = "postalCode";
    const COUNTRY_FIELD_ID = "country";
    const LOGIN_FIELD_ID = "login";
    const PESEL_FIELD_ID = "pesel";
    const PASSWORD_FIELD_ID = "password";
    const REPEAT_PASSWORD_FIELD_ID = "second_password";
    const SUBMIT_BUTTON_ID = "button-reg-form";

    var HTTP_STATUS = {OK: 200, CREATED: 201, NOT_FOUND: 404};

    prepareEventOnNameChange();
    prepareEventOnSurnameChange();
    prepareEventOnDateChange();
    prepareEventOnStreetChange();
    prepareEventOnAdressNumberChange();
    prepareEventOnPostalCodeChange();
    prepareEventOnCountryChange();
    prepareEventOnLoginChange();
    prepareEventOnPeselChange();
    prepareEventOnPasswordChange();
    prepareEventOnRepeatPasswordChange();

    let registrationForm = document.getElementById("registration-form");

    registrationForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if(isFormOK()) {
            submitRegisterForm();
            setTimeout(function(){
                if (document.getElementById("correctRegister") !== null) {
                    window.location = "/";
                }
            }, 2000);
        }
    });

    function isFormOK() {
        let emptyFieldWarningMessage = "Wszystkie pola są wymagane! Aby przejść dalej proszę wszystkie poprawnie wypełnić.";
        let emptyFieldWaringElemId = "emptyWarning";
        if(isAnyInputEmpty()) {
            showWarningMessage(emptyFieldWaringElemId, emptyFieldWarningMessage, SUBMIT_BUTTON_ID);
            return false;
        } else {
            removeWarningMessage(emptyFieldWaringElemId);
        }
        let nameWarningElemId = document.getElementById("nameWarning");
        let surnameWarningElemId = document.getElementById("surnameWarning");
        let birthDateYearWarningElemId = document.getElementById("yearWarning");
        let streetWarningElemId = document.getElementById("streetWarning");
        let adressNumberWarningElemId = document.getElementById("adressNumberWarning");
        let postalCodeWarningElemId = document.getElementById("postalCodeWarning");
        let countryWarningElemId = document.getElementById("countryWarning");
        let loginAvailabilityWarningElemId = document.getElementById("availableLoginWarning");
        let loginValidityWarningElemId = document.getElementById("validLoginWarning");
        let peselWaringElemId = document.getElementById("peselWaring");
        let passwordWarningElemId = document.getElementById("passwordWarning");
        let repeatPasswordWarningElemId = document.getElementById("repeatPasswordWarning");

        

        if( nameWarningElemId === null &&
            surnameWarningElemId === null &&
            birthDateYearWarningElemId === null &&
            streetWarningElemId === null &&
            adressNumberWarningElemId === null &&
            postalCodeWarningElemId === null &&
            countryWarningElemId === null &&
            loginAvailabilityWarningElemId === null &&
            loginValidityWarningElemId === null &&
            peselWaringElemId === null &&
            passwordWarningElemId === null &&
            repeatPasswordWarningElemId === null) {
            return true;
        } else {
            return false;
        }
    }

    function isAnyInputEmpty() {
        if (
            document.getElementById(NAME_FIELD_ID).value === "" ||
            document.getElementById(SURNAME_FIELD_ID).value === "" ||
            document.getElementById(BIRTH_DATE_FIELD_ID).value === "" ||
            document.getElementById(STREET_FIELD_ID).value === "" ||
            document.getElementById(ADRESS_NUMBER_FIELD_ID).value === "" ||
            document.getElementById(POSTAL_CODE_FIELD_ID).value === "" ||
            document.getElementById(COUNTRY_FIELD_ID).value === "" ||
            document.getElementById(LOGIN_FIELD_ID).value === "" ||
            document.getElementById(PESEL_FIELD_ID).value === "" ||
            document.getElementById(PASSWORD_FIELD_ID).value === "" ||
            document.getElementById(REPEAT_PASSWORD_FIELD_ID).value === ""
        ) {
            return true;
        } else {
            return false;
        }
        
        
    }

    function prepareEventOnLoginChange() {
        let loginInput = document.getElementById(LOGIN_FIELD_ID);
        loginInput.addEventListener("change", updateLoginAvailabilityMessage);
    }

    function prepareEventOnPeselChange() {
        let peselInput = document.getElementById(PESEL_FIELD_ID);
        peselInput.addEventListener("change", updatePeselValidityMessage);
    }

    function prepareEventOnPasswordChange() {
        let passwordInput = document.getElementById(PASSWORD_FIELD_ID);
        passwordInput.addEventListener("change", updatePasswordValidityMessage);
        passwordInput.addEventListener("change", updateRepeatPasswordValidityMessage);
    }

    function prepareEventOnRepeatPasswordChange() {
        let repeatPasswordInput = document.getElementById(REPEAT_PASSWORD_FIELD_ID);
        repeatPasswordInput.addEventListener("change", updateRepeatPasswordValidityMessage);
    }

    function prepareEventOnDateChange() {
        let dateInput = document.getElementById(BIRTH_DATE_FIELD_ID);
        dateInput.addEventListener("change", updateDateValidityMessage);
    }

    function prepareEventOnPostalCodeChange() {
        let postalCode = document.getElementById(POSTAL_CODE_FIELD_ID);
        postalCode.addEventListener("change", updatePostalCodeValidityMessage);
    }

    function prepareEventOnCountryChange() {
        let country = document.getElementById(COUNTRY_FIELD_ID);
        country.addEventListener("change", updateCountryValidityMessage);
    }

    function prepareEventOnNameChange() {
        let name = document.getElementById(NAME_FIELD_ID);
        name.addEventListener("change", updateNameValidityMessage);
    }

    function prepareEventOnSurnameChange() {
        let surname = document.getElementById(SURNAME_FIELD_ID);
        surname.addEventListener("change", updateSurnameValidityMessage);
    }

    function prepareEventOnStreetChange() {
        let street = document.getElementById(STREET_FIELD_ID);
        street.addEventListener("change", updateStreetValidityMessage);
    }

    function prepareEventOnAdressNumberChange() {
        let adressNumber = document.getElementById(ADRESS_NUMBER_FIELD_ID);
        adressNumber.addEventListener("change", updateAdressNumberValidityMessage);
    }


    function updateLoginAvailabilityMessage() {
        let availabilityWarningElemId = "availableLoginWarning";
        let validityWarningElemId = "validLoginWarning";
        let loginTakenWarningMessage = "Ten login jest już zajęty.";
        let wrongLoginFormatWarningMessage = "Login musi składać się z 5 znaków i zawierać tylko litery."

        isLoginAvailable().then(function (isAvailable) {
            if (isAvailable) {
                removeWarningMessage(availabilityWarningElemId);
            } else {
                showWarningMessage(availabilityWarningElemId, loginTakenWarningMessage, LOGIN_FIELD_ID);
            }
        }).catch(function (error) {
            console.error("Something went wrong while checking login.");
            console.error(error);
        });

        if (isLoginValid() === true) {
            removeWarningMessage(validityWarningElemId);
        } else {
            showWarningMessage(validityWarningElemId, wrongLoginFormatWarningMessage, LOGIN_FIELD_ID)
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

    function isLoginAvailable() {
        return Promise.resolve(checkLoginAvailability().then(function (statusCode) {
            if (statusCode === HTTP_STATUS.OK) {
                return false;

            } else if (statusCode === HTTP_STATUS.NOT_FOUND) {
                return true;

            } else {
                throw "Unknown login availability status: " + statusCode;
            }
        }));
    }

    function checkLoginAvailability() {
        let loginInput = document.getElementById(LOGIN_FIELD_ID);
        let baseUrl = URL + "register/";
        let userUrl = baseUrl + loginInput.value;

        return Promise.resolve(fetch(userUrl, {method: GET}).then(function (resp) {
            return resp.status;
        }).catch(function (err) {
            return err.status;
        }));
    }

    function submitRegisterForm() {
        let login = document.getElementById(LOGIN_FIELD_ID).value
        let registerUrl = URL + "register/create_new_user/" + login;

        let registerParams = {
            method: POST,
            body: new FormData(registrationForm),
            redirect: "follow"
        };

        fetch(registerUrl, registerParams)
            .then(response => getRegisterResponseData(response))
            .then(response => displayInConsoleCorrectResponse(response))
            .catch(err => {
                console.log("Caught error: " + err);
            });
    }

    function getRegisterResponseData(response) {  // to remove
        let status = response.status;

        if (status === HTTP_STATUS.OK || status === HTTP_STATUS.CREATED) {
            return response;
        } else {
            console.error("Response status code: " + response.status);
            throw "Unexpected response status: " + response.status;
        }
    }

    function displayInConsoleCorrectResponse(correctResponse) {
        let status = correctResponse.status;
        console.log("status " + status)
        let correctRegisterInfo = "correctRegister";
        let sucessMessage = "Użytkownik został zarejestrowany pomyślnie. Zaraz nastąpi przekierowanie.";
        let warningRegisterInfo = "unsuccessfulRegister";
        let warningMessage = "Podczas rejstracji wystąpił błąd.";

        if (status !== HTTP_STATUS.CREATED) {
            removeWarningMessage(correctRegisterInfo);
            showWarningMessage(warningRegisterInfo, warningMessage, SUBMIT_BUTTON_ID);
            console.log("Errors: " + correctResponse.errors);
        } else {
            removeWarningMessage(warningRegisterInfo);
            showSuccesMessage(correctRegisterInfo, sucessMessage, SUBMIT_BUTTON_ID);
        }
    }


    function updatePeselValidityMessage() {
        let peselWaringElemId = "peselWaring";
        let waringMessage = "Proszę wprowadzić poprawny numer PESEL.";

        if (isPeselValid()) {
            removeWarningMessage(peselWaringElemId);
        } else {
            showWarningMessage(peselWaringElemId, waringMessage, PESEL_FIELD_ID);
        }
    }

    function isPeselValid() {
        let peselInput = document.getElementById(PESEL_FIELD_ID);
        if (peselInput.value.length !== 11) {
            return false;
        }
        let year = peselInput.value[0] * 10 + peselInput.value[1] * 1;
        let month = peselInput.value[2] * 10 + peselInput.value[3] * 1 - 1;
        while (month > 11) {
            month -= 20;
            if (month < 0) {
                return false;
                break;
            }
            year += 100;
        }
        year += 1900;
        if (year > 2299) {
            year -= 500;
        }
        let day = peselInput.value[4] * 10 + peselInput.value[5] * 1;
        let birthday = new Date(year, month, day);
        if (birthday.getDate() === day
            && birthday.getMonth() === month
            && birthday.getFullYear() === year) {
            let controlSum =
                (peselInput.value[0] * 1) % 10 +
                (peselInput.value[1] * 3) % 10 +
                (peselInput.value[2] * 7) % 10 +
                (peselInput.value[3] * 9) % 10 +
                (peselInput.value[4] * 1) % 10 +
                (peselInput.value[5] * 3) % 10 +
                (peselInput.value[6] * 7) % 10 +
                (peselInput.value[7] * 9) % 10 +
                (peselInput.value[8] * 1) % 10 +
                (peselInput.value[9] * 3) % 10;
            while (controlSum > 10) {
                controlSum %= 10;
            }
            controlSum = 10 - controlSum;
            if (controlSum == peselInput.value[10]) {
                return true;
            } else {
                return false;
            }
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

    function isPasswordValid() {
        let regExpression = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#\$%\^&\*]).{8,}$/;
        let password = document.getElementById(PASSWORD_FIELD_ID);
        if (password.value.match(regExpression)) {
            return true;
        } else {
            return false;
        }
    }

    function updateRepeatPasswordValidityMessage() {
        let warningElemId = "repeatPasswordWarning";
        let warningMessage = "Hasła nie są identyczne!";

        if (arePasswordsTheSame() === true) {
            removeWarningMessage(warningElemId);
        } else {
            showWarningMessage(warningElemId, warningMessage, REPEAT_PASSWORD_FIELD_ID);
        }
    }

    function arePasswordsTheSame() {
        let password = document.getElementById(PASSWORD_FIELD_ID);
        let repeatPassword = document.getElementById(REPEAT_PASSWORD_FIELD_ID);

        if (password.value === repeatPassword.value) {
            return true;
        } else {
            return false;
        }
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

    function updateDateValidityMessage() {
        let warningYearElemId = "yearWarning";
        let warningYearMessage = "Podany rok nie jest prawidłowy. Musi zawierać się od 1900 do roku obecnego.";
        let warningDateElemId = "dateWarning";

        if (document.getElementById(BIRTH_DATE_FIELD_ID).value !== undefined){
            removeWarningMessage(warningDateElemId);
        }
        let birthDate = new Date(document.getElementById(BIRTH_DATE_FIELD_ID).value);
        year = birthDate.getFullYear();
    
        if (year > 1900 && year < new Date().getFullYear()) {
            removeWarningMessage(warningYearElemId);
        } else {
            showWarningMessage(warningYearElemId, warningYearMessage, BIRTH_DATE_FIELD_ID);
        }
    }

    function updatePostalCodeValidityMessage() {
        let warningElemId = "postalCodeWarning";
        let warningMessage = "Na razie akceptujemy tylko przesyłki narodowe. Kod musi mieć formę XX-XXX.";
        let postalCode = document.getElementById(POSTAL_CODE_FIELD_ID).value;

        regExpression = /^[0-9]{2}(?:-[0-9]{3})?$/;
        
        if (postalCode.match(regExpression)) {
            removeWarningMessage(warningElemId);
        } else {
            showWarningMessage(warningElemId, warningMessage, POSTAL_CODE_FIELD_ID);
        }
    }

    function updateCountryValidityMessage() {
        let warningElemId = "countryWarning";
        let warningMessage = "Na razie akceptujemy tylko przesyłki narodowe. To pole musi mieć wartość 'Poland' lub 'Polska'";
        let country = document.getElementById(COUNTRY_FIELD_ID).value;

        
        if (country == "Polska" || country == "Poland") {
            removeWarningMessage(warningElemId);
        } else {
            showWarningMessage(warningElemId, warningMessage, COUNTRY_FIELD_ID);
        }
    }

    function updateNameValidityMessage() {
        let warningElemId = "nameWarning";
        let warningMessage = "To pole nie może być puste i musi składać się wyłącznie z liter.";
        let name = document.getElementById(NAME_FIELD_ID).value;
        let regExpression = /^[A-Za-ząćęłńóśźżĄĘŁŃÓŚŹŻ]+$/;

        if (name.match(regExpression)) {
            removeWarningMessage(warningElemId);
        } else {
            showWarningMessage(warningElemId, warningMessage, NAME_FIELD_ID);
        }
    }

    function updateSurnameValidityMessage() {
        let warningElemId = "surnameWarning";
        let warningMessage = "To pole nie może być puste i musi składać się wyłącznie z liter.";
        let surname = document.getElementById(SURNAME_FIELD_ID).value;
        let regExpression = /^[A-Za-ząćęłńóśźżĄĘŁŃÓŚŹŻ]+$/;

        if (surname.match(regExpression)) {
            removeWarningMessage(warningElemId);
        } else {
            showWarningMessage(warningElemId, warningMessage, SURNAME_FIELD_ID);
        }
    }

    function updateAdressNumberValidityMessage() {
        let warningElemId = "adressNumberWarning";
        let warningMessage = "To pole nie może być puste i musi składać się wyłącznie z cyfr.";
        let adressNumber = document.getElementById(ADRESS_NUMBER_FIELD_ID).value;
        let regExpression = /^[0-9]+$/;

        if (adressNumber.match(regExpression)) {
            removeWarningMessage(warningElemId);
        } else {
            showWarningMessage(warningElemId, warningMessage, ADRESS_NUMBER_FIELD_ID);
        }
    }

    function updateStreetValidityMessage() {
        let warningElemId = "streetWarning";
        let warningMessage = "To pole nie może być puste.";
        let street = document.getElementById(STREET_FIELD_ID).value;
  

        if (street.length > 0) {
            removeWarningMessage(warningElemId);
        } else {
            showWarningMessage(warningElemId, warningMessage, STREET_FIELD_ID);
        }
    }


});