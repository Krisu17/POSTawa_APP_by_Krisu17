#POSTawa App by Krisu

##Uruchomienie aplikacji poprzez komendę:

sudo docker-compose up --build

##Adresy:

https://localhost:8080/ - dotychczasowa aplikacja klienta https://localhost:8081/ - dotychczasowa aplikacja obsługująca pliki pdf https://localhost:8082/ - aplikacja kuriera https://localhost:8083/ - aplikacja paczkomatu https://localhost:8084/ - aplikacja służąca jako pośrednik do komunikacji przez web-sockets

##Dodatkowe uwagi: Bardzo ważne jest, aby najpierw odwiedzić wszystkie wyżej wymienione witryny, aby zaakceptować blokadę ryzyka przy braku certyfikatu https.

Ze względu na to, że miałem pewne zaległości z poprzednich kamieni milowych, musiałem je ponadrabiać szybko, poniważ nie dało się przetestować nowych funkcjonalności. Dlatego też między innymi został usunięty czas ważności żetonu służacego do autoryzacji kuriera w paczkomacie, jednak nie jest to w tym kamieniu oceniane, więc postaram się to przygotować do terminu poprawkowego.

##Dla Pana wygody pod ukrytym adresem:

https://localhost:8082/register jest formularz rejstracji nowych kurierów z podstawową walidacją

https://localhost:8082/register_kurier_oauth jest link do rejstracji nowych kurierów przez oAuth

##Pod adresem https://localhost:8082/login_kurier_oauth jest możliwe jedynie zalogowanie się na konto kuriera, rejstracja jest niemożliwa (chyba że pod adresem https://localhost:8082/register_kurier_oauth)

##Uruchomienie przeglądarki z wyłączonymi certyfikatami google-chrome --ignore-certificate-errors --unsafely-treat-insecure-origin-as-secure=https://localhost:8083 --allow-insecure-localhost https://localhost:8083/login/