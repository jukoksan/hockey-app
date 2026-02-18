*** Settings ***
Library    Browser

*** Keywords ***
Open App
    [Documentation]    Käynnistä selain kerran koko suitea varten.
    New Browser    chromium    headless=${HEADLESS}

Reset App State
    [Documentation]    Luo UUSI context ja sivu jokaista testiä varten (tyhjä local/session storage).
#    New Context    service_workers=block
    New Page       ${BASE_URL}
    Wait For Elements State    css=[data-testid="app-root"]    visible    20s

Add Players
    [Arguments]    @{names}
    ${joined}=    Evaluate    "\\n".join(${names})
    Fill Text     css=[data-testid="names-textarea"]    ${joined}
    Click         css=[data-testid="add-names"]

Select Goalie
    [Arguments]    ${name}
    Click         css=[data-testid="select-goalie-trigger"]
    Click         text=${name}
