import { BMOSettings, DEFAULT_SETTINGS } from "src/main";
import { colorToHex } from "src/utils/ColorConverter";
import { codeBlockCopyButton, displayAppendButton, displayBotCopyButton, displayBotEditButton } from "./Buttons";
import { ANTHROPIC_MODELS } from "src/view";
import { marked } from "marked";
import { prismHighlighting } from "../PrismaHighlighting";
import { addParagraphBreaks } from "./Message";

export function displayBotMessage(settings: BMOSettings, messageHistory: { role: string; content: string }[], message: string) {
    const botMessageDiv = document.createElement("div");
    botMessageDiv.className = "botMessage";
    
    botMessageDiv.style.backgroundColor = colorToHex(settings.appearance.botMessageBackgroundColor ||
        getComputedStyle(document.body).getPropertyValue(DEFAULT_SETTINGS.appearance.botMessageBackgroundColor).trim());

    const botMessageToolBarDiv = document.createElement("div");
    botMessageToolBarDiv.className = "botMessageToolBar";

    const buttonContainerDiv = document.createElement("div");
    buttonContainerDiv.className = "button-container";

    const botNameSpan = document.createElement("span"); 
    botNameSpan.textContent = settings.appearance.chatbotName || DEFAULT_SETTINGS.appearance.chatbotName;
    botNameSpan.className = "chatbotName";

    let botP = '';

    const messageText = message;
    if (messageHistory.length >= 2) {
        if (ANTHROPIC_MODELS.includes(settings.general.model)) {
            const cleanString = messageText.split(' ').slice(1).join(' ').trim();
            botP = marked(cleanString);
        } else if (message.includes('div class="formattedSettings"')) {
            botP = message;
        } 
        else {
            botP = marked(message);
        }                                  
    }

    botP = botP.replace(/<p>/g, '').replace(/<\/p>/g, '');

    const newBotP = document.createElement('p');
    newBotP.innerHTML = botP;

    botMessageToolBarDiv.appendChild(botNameSpan);
    botMessageToolBarDiv.appendChild(buttonContainerDiv);

    if (!messageText.includes('div class="formattedSettings"')) {
        const editButton = displayBotEditButton(settings, newBotP);
        const copyBotButton = displayBotCopyButton(settings, message);
        const appendButton = displayAppendButton(message);
        buttonContainerDiv.appendChild(editButton);
        buttonContainerDiv.appendChild(copyBotButton);
        buttonContainerDiv.appendChild(appendButton);
    }

    const messageBlockDiv = document.createElement("div");
    messageBlockDiv.className = "messageBlock";

    botMessageDiv.appendChild(botMessageToolBarDiv);
    messageBlockDiv.appendChild(newBotP);
    botMessageDiv.appendChild(messageBlockDiv);

    prismHighlighting(messageBlockDiv);
    codeBlockCopyButton(messageBlockDiv);
    if (!message.includes('div class="formattedSettings"')){
        addParagraphBreaks(messageBlockDiv);        
    }

    return botMessageDiv;
}

export function displayLoadingBotMessage(settings: BMOSettings) {
    const botMessageDiv = document.createElement("div");
    botMessageDiv.className = "botMessage";
    botMessageDiv.style.backgroundColor = colorToHex(settings.appearance.botMessageBackgroundColor ||
        getComputedStyle(document.body).getPropertyValue(DEFAULT_SETTINGS.appearance.botMessageBackgroundColor).trim());

    const botMessageToolBarDiv = document.createElement("div");
    botMessageToolBarDiv.className = "botMessageToolBar";

    const botNameSpan = document.createElement("span"); 
    botNameSpan.textContent = settings.appearance.chatbotName || DEFAULT_SETTINGS.appearance.chatbotName;
    botNameSpan.className = "chatbotName";

    const messageBlockDiv = document.createElement("div");
    messageBlockDiv.className = "messageBlock";

    const loadingEl = document.createElement("span");
    loadingEl.setAttribute("id", "loading"); 
    for (let i = 0; i < 3; i++) {
        const dotSpan = document.createElement("span");
        dotSpan.textContent = ".";
        loadingEl.appendChild(dotSpan);
    }

    botMessageToolBarDiv.appendChild(botNameSpan);
    botMessageDiv.appendChild(botMessageToolBarDiv);
    botMessageDiv.appendChild(messageBlockDiv);

    // Dispaly loading animation
    botMessageDiv.appendChild(loadingEl);

    return botMessageDiv;
}