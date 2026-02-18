*** Settings ***
Documentation     End-to-end UI -testit Hockey-appille. Pilkottu kuuteen riippumattomaan testiin.
Library           Browser
Resource          Keywords.resource
Suite Setup       Open App
Suite Teardown    Browser.Close Browser
Test Setup        Reset App State

*** Variables ***
# Aja lokaalisti:
#   robot -v BASE_URL:http://localhost:5173/ tests/hockey_ui.robot
# Tai GitHub Pages:
#   robot -v BASE_URL:https://jukoksan.github.io/hockey-app/ tests/hockey_ui.robot
${BASE_URL}       http://localhost:5173/
${HEADLESS}       false

@{TEST_PLAYER_NAMES}    Matti Meikäläinen    Teemu Testaaja    Kalle Kettu    Ville Vire    Janne Jokunen    Pekka Peloton    Jukka Jäähylä

*** Test Cases ***
1 Syötä nimet
    [Documentation]    Varmistaa että nimien syöttö kasvattaa pelaajamäärää.
    Add Players                       @{TEST_PLAYER_NAMES}
    Wait For Elements State           css=[data-testid="players-count"]    visible
    ${players_text}=                  Get Text    css=[data-testid="players-count"]
    Should Contain                    ${players_text}    Pelaajia: 7

2 Valitse maalivahti
    [Documentation]    Varmistaa MV-valinnan näkymisen headerissa.
    Setup With Players                @{TEST_PLAYER_NAMES}
    Select Goalie                     Matti Meikäläinen
    Wait For Elements State           css=[data-testid="goalie-name"]      visible
    ${mv}=                            Get Text   css=[data-testid="goalie-name"]
    Should Be Equal As Strings        ${mv}      Matti Meikäläinen

3 Muodosta kentät automaattisesti
    [Documentation]    Varmistaa että automaattijako luo vähintään yhden kentän.
    Setup With Players And Goalie     Matti Meikäläinen    @{TEST_PLAYER_NAMES}
    Click                             css=[data-testid="auto-lines"]
    Wait For Elements State           css=[data-testid^="line-0"]           visible

4 Lisää kotijoukkueelle maali ja aseta tekijä
    [Documentation]    Lisää koti-maalin ja valitsee tekijäksi Teemu Testaajan.
    Setup With Full Lines             Matti Meikäläinen    @{TEST_PLAYER_NAMES}
    # Käytetään robustia keyword-toteutusta (data-testid-selektorit, ei xpathia)
    Open Home Scorer Select (Robust)

    # Valitse tekijä
    Wait For Elements State    role=listbox >> role=option[name="Teemu Testaaja"]    visible    5s
    Click                      role=listbox >> role=option[name="Teemu Testaaja"]

    # Varmista tulos
    Wait For Elements State    css=[data-testid="home-value"]    visible    5s
    Wait Until Keyword Succeeds    5 s    200 ms    Element Text Should Be    css=[data-testid="home-value"]    1
    Wait Until Keyword Succeeds    5 s    200 ms    Element Text Should Be    css=[data-testid="score-value"]    1 - 0

    Wait For Elements State    css=[data-testid="goals-list"]    visible
    Wait For Elements State    css=[data-testid^="goal-scorer-"]    visible    5s
    ${text}=    Get Text       css=[data-testid^="goal-scorer-"]
    Should Be Equal As Strings    ${text}    Teemu Testaaja

5 Muokkaa viimeisimmän maalin tekijä
    [Documentation]    Muuttaa juuri lisätyn maalin tekijän Teemusta Kalleen.
    Setup With Full Lines             Matti Meikäläinen    @{TEST_PLAYER_NAMES}

    # Lisää ensin maali + valitse tekijä (Teemu)
    Open Home Scorer Select (Robust)
    Wait For Elements State    role=listbox >> role=option[name="Teemu Testaaja"]    visible    5s
    Click                      role=listbox >> role=option[name="Teemu Testaaja"]

    # Nyt muokkaa viimeisimmän maalin tekijä “Muokkaa”-napista
    Click                      css=[data-testid="goals-list"] >> text=Muokkaa
    Wait For Elements State    css=[data-testid^="goal-edit-trigger-"]    visible    5s
    Click                      css=[data-testid^="goal-edit-trigger-"]

    # Valitse Kalle Kettu avoimesta listboxista
    Wait For Elements State    role=listbox >> role=option[name="Kalle Kettu"]    visible    5s
    Click                      role=listbox >> role=option[name="Kalle Kettu"]

    # Varmista että nimi päivittyi
    Wait For Elements State    text=Kalle Kettu    visible    5s

6 Poista maali ja nollaa tilanne
    [Documentation]    Poistaa viimeisimmän maalin; tilanne muuttuu 1-0 -> 0-0; lista tyhjenee.
    Setup With Full Lines             Matti Meikäläinen    @{TEST_PLAYER_NAMES}
    Click                             css=[data-testid="add-goal-home"]
    Wait For Elements State           css=[data-testid="home-scorer-trigger"]    visible
    Click                             css=[data-testid="home-scorer-trigger"]
    Click                             role=option[name="Teemu Testaaja"]
    Wait For Elements State           css=[data-testid="goals-list"]       visible
    Click                             css=[data-testid="goals-list"] >> text=Poista
    Wait For Condition                return document.querySelector('[data-testid="home-value"]').textContent.trim() === '0'
    ${score2}=                        Get Text   css=[data-testid="score-value"]
    Should Be Equal As Strings        ${score2}  0 - 0
    Wait For Elements State           css=[data-testid="goals-empty"]      visible
