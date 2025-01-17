import { Notice } from 'obsidian';
import { BMOSettings, DEFAULT_SETTINGS } from "../../main";
import { colorToHex } from "../../utils/ColorConverter";
import { filenameMessageHistoryJSON, messageHistory } from "../../view";
import BMOGPT from '../../main';
import { getAbortController } from '../FetchModel';
import { fetchModelRenameTitle } from '../editor/FetchRenameNoteTitle';
import { addMessage } from './Message';

// Commands
export function executeCommand(input: string, settings: BMOSettings, plugin: BMOGPT) {
  const command = input.split(' ')[0]; // Get the first word from the input
  
  switch (command) {
      case '/commands':
      case '/help':
      case '/h':
          commandHelp(settings);
          break;
      case '/model':
      case '/models':
          return commandModel(input, settings, plugin);
      case '/prompt':
      case '/prompts':
          return commandPrompt(input, settings, plugin);
      case '/reference':
      case '/ref':
          commandReference(input, settings, plugin);
          break;
      case '/temp':
          commandTemperature(input, settings, plugin);
          break;
      case '/maxtokens':
          commandMaxTokens(input, settings, plugin);
          break;
      case '/system':
          commandSystem(input, settings, plugin);
          break;
      case '/append':
          commandAppend(settings);
          break;
      case '/save':
          commandSave(settings);
          break;
      case '/clear':
      case '/c':
          removeMessageThread(0);
          break;
      case '/stop':
      case '/s':
          commandStop();
          break;
      default:
          commandFalse(settings, plugin);
  }
}

// Function to create and append a bot message
export function createBotMessage(settings: BMOSettings): HTMLDivElement {
  const messageContainer = document.querySelector("#messageContainer");
  const botMessage = document.createElement("div");
  botMessage.classList.add("botMessage");
  botMessage.style.backgroundColor = colorToHex(
    settings.appearance.botMessageBackgroundColor ||
      getComputedStyle(document.body).getPropertyValue(DEFAULT_SETTINGS.appearance.botMessageBackgroundColor).trim()
  );
  messageContainer?.appendChild(botMessage);

  const botNameSpan = document.createElement("span");
  botNameSpan.textContent = settings.appearance.chatbotName || DEFAULT_SETTINGS.appearance.chatbotName;
  botNameSpan.className = "chatbotName";
  botMessage.appendChild(botNameSpan);

  const messageBlock = document.createElement("div");
  messageBlock.classList.add("messageBlock");
  botMessage.appendChild(messageBlock);

  return messageBlock;
}

// Function to display the message in the Chatbot
function displayMessage(messageBlock: HTMLDivElement, messageHtml: string, settings: BMOSettings) {
  const index = messageHistory.length - 1;
  const messageContainer = document.querySelector("#messageContainer");

  if (messageContainer) {
    const botMessages = messageContainer.querySelectorAll(".botMessage");
    const lastBotMessage = botMessages[botMessages.length - 1];

    const messageBlock2 = lastBotMessage.querySelector(".messageBlock");

    if (messageBlock2) {
      messageBlock2.innerHTML = messageHtml;
      addMessage(messageBlock.innerHTML, 'botMessage', settings, index);

      lastBotMessage.appendChild(messageBlock2);
      lastBotMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

export async function commandFalse(settings: BMOSettings, plugin: BMOGPT) {
  const messageBlock = createBotMessage(settings);
  

  const formattedSettings = `
      <div class="formattedSettings">
          <p><strong>Command not recognized.</strong></p>
      </div>
  `;

  displayMessage(messageBlock, formattedSettings, settings);
  await plugin.saveSettings();
  // new Notice("Invalid command.");
}

// =================== COMMAND FUNCTIONS ===================

// `/help` for help commands
export function commandHelp(settings: BMOSettings) {
  const messageBlock = createBotMessage(settings);

  const formattedSettings = `
    <div class="formattedSettings">
      <h2>Commands</h2>
      <p><code>/model "[MODEL-NAME]" or [VALUE]</code> - List or change model.</p>
      <p><code>/prompt "[PROMPT-NAME]" or [VALUE]</code> - List or change prompt.</p>
      <p><code>/prompt clear</code> - Clear prompt.</p>
      <p><code>/system "[PROMPT]"</code> - Change system setting.</p>
      <p><code>/maxtokens [VALUE]</code> - Set max tokens.</p>
      <p><code>/temp [VALUE]</code> - Change temperature range 0 from to 1.</p>
      <p><code>/ref on | off</code> - Turn on or off "reference current note".</p>
      <p><code>/append</code> - Append current chat history to current active note.</p>
      <p><code>/save</code> - Save current chat history to a note.</p>
      <p><code>/clear</code> or <code>/c</code> - Clear chat history.</p>
      <p><code>/stop</code> or <code>/s</code> - [STREAMING MODELS ONLY]: Stop fetching response.</p>
    </div>
  `;

  displayMessage(messageBlock, formattedSettings, settings);
}

// `/model "[VALUE]"` to change model.
export async function commandModel(input: string, settings: BMOSettings, plugin: BMOGPT) {
  const messageBlock = createBotMessage(settings);
  // Check if the user has not specified a model after the "/model" command
  if (!input.split(' ')[1]) {

    // Loop through allModels and create list items
    const modelListItems = settings.allModels.map(model => `<li>${model}</li>`).join('');

    let currentModel = settings.general.model;

    // Check if currentModel is empty, and set it to "Empty" if it is
    if (!currentModel) {
      currentModel = "Empty";
    }
  
    const formattedSettings = 
    `<div class="formattedSettings">
    <h2>Models</h2>
    <p><b>Current Model:</b> ${currentModel}</p>
      <ol>${modelListItems}</ol>
    </div>`;
  
    displayMessage(messageBlock, formattedSettings, settings);
  }

  // Check if the user has specified a model after the "/model" command
  if (input.split(' ')[1] !== undefined) {
    const inputModel = input.split(' ')[1].replace(/^"(.*)"$/, '$1');

    let messageHtml = "";

    const modelAliases: { [key: string]: string } = {};

    for (let i = 1; i <= settings.allModels.length; i++) {
      const model = settings.allModels[i - 1];
      modelAliases[i] = model;
    }

    if (Object.entries(modelAliases).find(([key, val]) => key === inputModel)){
      settings.general.model = modelAliases[inputModel];
      messageHtml = `<div class="formattedSettings"><p><strong>Updated Model to ${settings.general.model}</strong></p></div>`;
    }
    else if (Object.entries(modelAliases).find(([key, val]) => val === inputModel)) {
      settings.general.model = modelAliases[Object.keys(modelAliases).find(key => modelAliases[key] === inputModel) || ''];
      messageHtml = `<div class="formattedSettings"><p><strong>Updated Model to ${settings.general.model}</strong></p></div>`;
    }
    else {
      messageHtml = `<div class="formattedSettings"><p><strong>Model '${inputModel}' does not exist for this API key.</strong></p></div>`;
      new Notice("Invalid model.");
    }

    displayMessage(messageBlock, messageHtml, settings);
    await plugin.saveSettings();
    return settings;
  }
}

// `/prompt "[VALUE]"` to change prompt.
export async function commandPrompt(input: string, settings: BMOSettings, plugin: BMOGPT) {

  if (!settings.prompts.promptFolderPath) {
    new Notice("Prompt folder path not set.");
    return;
  }

  // Fetching files from the specified folder
  const files = app.vault.getFiles().filter((file) => file.path.startsWith(plugin.settings.prompts.promptFolderPath));

  const messageBlock = createBotMessage(settings);

  // Sorting the files array alphabetically by file name
  files.sort((a, b) => a.name.localeCompare(b.name));

  // Check if the user has not specified a prompt after the "/prompt" command
  if (!input.split(' ')[1]) {

    // Loop through files and create list items, removing the file extension
    const fileListItems = files.map(file => {
      const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, ""); // Removing the last dot and what follows
      return `<li>${fileNameWithoutExtension}</li>`;
    }).join('');

    let currentPrompt = settings.prompts.prompt.replace(/\.[^/.]+$/, ""); // Removing the file extension

    // Check if currentPrompt is empty, and set it to "Empty" if it is
    if (!currentPrompt) {
      currentPrompt = "Empty";
    }

    const formattedSettings = 
    `<div class="formattedSettings">
    <h2>Prompts</h2>
      <p><b>Current prompt:</b> ${currentPrompt}</p>
      <ol>${fileListItems}</ol>
    </div>`;

    displayMessage(messageBlock, formattedSettings, settings);
    return;
  }

  // Check if the user has specified a prompt after the "/prompt" command
  if (input.startsWith('/prompt ')) {
    let inputValue = input.substring('/prompt '.length).trim();
    let messageHtml = "";

    // Remove quotation marks if present
    if ((inputValue.startsWith('"') && inputValue.endsWith('"')) ||
        (inputValue.startsWith("'") && inputValue.endsWith("'"))) {
      inputValue = inputValue.substring(1, inputValue.length - 1);
    }

    // Set to default or empty if the input is 'clear' or 'c'
    if (inputValue === 'clear' || inputValue === 'c') {
      settings.prompts.prompt = ''; // Set to default or empty
      messageHtml = `<div class="formattedSettings"><p><strong>Prompt cleared.</strong></p></div>`;
      displayMessage(messageBlock, messageHtml, settings);
      await plugin.saveSettings();
      return settings;
    }
    
    const promptAliases: { [key: string]: string } = {};
    
    // Create aliases for each file (prompt)
    for (let i = 1; i <= files.length; i++) {
      const fileNameWithoutExtension = files[i - 1].name.replace(/\.[^/.]+$/, "");
      promptAliases[i.toString()] = fileNameWithoutExtension;
    }

    let currentModel;
    if (promptAliases[inputValue]) {
      // If input matches a key in promptAliases
      settings.prompts.prompt = promptAliases[inputValue] + '.md';
      currentModel = settings.prompts.prompt.replace(/\.[^/.]+$/, ""); // Removing the file extension
      messageHtml = `<div class="formattedSettings"><p><strong>Updated Prompt to ${currentModel}</strong></p></div>`;
    } else if (Object.values(promptAliases).includes(inputValue)) {
      // If input matches a value in promptAliases
      settings.prompts.prompt = inputValue + '.md';
      currentModel = settings.prompts.prompt.replace(/\.[^/.]+$/, ""); // Removing the file extension
      messageHtml = `<div class="formattedSettings"><p><strong>Updated Prompt to ${currentModel}</strong></p></div>`;
    } else {
      // If the input prompt does not exist
      messageHtml = `<div class="formattedSettings"><p><strong>Prompt '${inputValue}' does not exist.</strong></p></div>`;
      new Notice("Invalid prompt.");
    }

    displayMessage(messageBlock, messageHtml, settings);
    await plugin.saveSettings();
    return settings;
  }

}

// `/ref` to turn on/off referenceCurrentNote.
export async function commandReference(input: string, settings: BMOSettings, plugin: BMOGPT) {
  const messageBlock = createBotMessage(settings);

  let formattedSettings = '';
  const referenceCurrentNoteElement = document.getElementById('referenceCurrentNote');
  const inputValue = input.split(' ')[1]?.toLowerCase();

  if (inputValue === "true" || inputValue === "on") {
    settings.general.allowReferenceCurrentNote = true;
      if (referenceCurrentNoteElement) {
          referenceCurrentNoteElement.style.display = 'block';
      }
      formattedSettings += `
          <div class="formattedSettings">
            <p><strong>Reference updated: on</strong></p>
          </div>
      `;
  } else if (inputValue === "false" || inputValue === "off") {
    settings.general.allowReferenceCurrentNote = false;
      if (referenceCurrentNoteElement) {
          referenceCurrentNoteElement.style.display = 'none';
      }
      formattedSettings += `
          <div class="formattedSettings">
            <p><strong>Reference updated: off</strong></p>
          </div>
      `;
  } else {
    formattedSettings += `
        <div class="formattedSettings">
          <p><strong>Invalid command.</strong></p>
        </div>
    `;
  }

  displayMessage(messageBlock, formattedSettings, settings);
  await plugin.saveSettings();
}

// `/temp "VALUE"` to change the temperature.
export async function commandTemperature(input: string, settings: BMOSettings, plugin: BMOGPT) {
  const messageBlock = createBotMessage(settings);

  const inputValue = input.split(' ')[1];
  const floatValue = parseFloat(inputValue);
  let temperatureSettingMessage: string;

  if (settings && !isNaN(floatValue) && floatValue >= 0.00 && floatValue <= 1.00) {
    settings.general.temperature = parseFloat((Math.round(floatValue / 0.05) * 0.05).toFixed(2));
      temperatureSettingMessage = `${settings.general.temperature}`;
  } else {
      temperatureSettingMessage = "Invalid.";
  }

  const formattedSettings = `
      <div class="formattedSettings">
        <p><strong>Temperature updated: ${temperatureSettingMessage}</strong></p>
      </div>
  `;

  displayMessage(messageBlock, formattedSettings, settings);
  await plugin.saveSettings();
}

// `/maxtokens` to change max_tokens.
export async function commandMaxTokens(input: string, settings: BMOSettings, plugin: BMOGPT) {
  const messageBlock = createBotMessage(settings);

  let formattedSettings = '';
  const maxTokensValue = input.split(' ')[1];
  let maxTokensSettingMessage: string;

  if (maxTokensValue !== undefined && maxTokensValue !== '') {
      const inputValue = parseInt(maxTokensValue);
  
      if (!isNaN(inputValue) && inputValue >= 0) {
          // Update max_tokens with the valid integer value
          settings.general.max_tokens = inputValue.toString();
          maxTokensSettingMessage = `Max tokens updated: ${inputValue}`;
      } else {
          // Input is not a valid integer
          maxTokensSettingMessage = "Max tokens update: invalid";
      }
  } else {
      // Clear max_tokens and inform the user
      settings.general.max_tokens = "";
      maxTokensSettingMessage = "Max tokens cleared.";
  }
  
  formattedSettings += `
      <div class="formattedSettings">
          <p><strong>${maxTokensSettingMessage}</strong></p>
      </div>
  `;

  displayMessage(messageBlock, formattedSettings, settings);
  await plugin.saveSettings();
}

// `/system "[VALUE]"` to change system prompt
export async function commandSystem(input: string, settings: BMOSettings, plugin: BMOGPT) {
  const messageBlock = createBotMessage(settings);

  let formattedSettings = '';
  const systemPromptValue = input.match(/"([^"]+)"/);

  if (systemPromptValue !== null) {
      if (systemPromptValue[1]) {
        settings.general.system_role = systemPromptValue[1];
          formattedSettings += `
              <div class="formattedSettings">
                  <p><strong>System updated: "${systemPromptValue[1]}"</strong></p>
              </div>
          `;
      }
  } else {
    settings.general.system_role = "";
      formattedSettings += `
          <div class="formattedSettings">
              <p><strong>System cleared.</strong></p>
          </div>
      `;
  }

  displayMessage(messageBlock, formattedSettings, settings);
  await plugin.saveSettings();
}

// `/append` to append current chat history to current active note.
export async function commandAppend(settings: BMOSettings) {
  let markdownContent = '';

  const activeFile = app.workspace.getActiveFile();

  if (activeFile?.extension === 'md') {
    const existingContent = await app.vault.read(activeFile);

    // Retrieve user and chatbot names
    const userNames = document.querySelectorAll('.userName') as NodeListOf<HTMLHeadingElement>;

    let userNameText = 'USER';
    if (userNames.length > 0) {
        const userNameNode = userNames[0];
        Array.from(userNameNode.childNodes).forEach((node) => {
            // Check if the node is a text node and its textContent is not null
            if (node.nodeType === Node.TEXT_NODE && node.textContent) {
                userNameText = node.textContent.trim().toUpperCase();
            }
        });
    }

    const chatbotNames = document.querySelectorAll('.chatbotName') as NodeListOf<HTMLHeadingElement>;
    const chatbotNameText = chatbotNames.length > 0 && chatbotNames[0].textContent ? chatbotNames[0].textContent.toUpperCase() : 'ASSISTANT';

    // Check and read the JSON file
    if (await this.app.vault.adapter.exists(filenameMessageHistoryJSON)) {
      try {
        const jsonContent = await this.app.vault.adapter.read(filenameMessageHistoryJSON);
        const messages = JSON.parse(jsonContent);

        // Filter out messages starting with '/', and the assistant's response immediately following it
        let skipNext = false;
        markdownContent += messages
          .filter((message: { role: string; content: string; }, index: number, array: string | any[]) => {
            if (skipNext && message.role === 'assistant') {
              skipNext = false;
              return false;
            }
            if (message.content.startsWith('/')) {
              // Check if next message is also from user and starts with '/'
              skipNext = index + 1 < array.length && array[index + 1].role === 'assistant';
              return false;
            }
            return true;
          })
          .map((message: { role: string; content: string; }) => {
            let roleText = message.role.toUpperCase();
            roleText = roleText === 'USER' ? userNameText : roleText;
            roleText = roleText === 'ASSISTANT' ? chatbotNameText : roleText;
            return `###### ${roleText}\n${message.content}\n`;
          })
          .join('\n');

          const messageBlock = createBotMessage(settings);

          const formattedSettings = `
            <div class="formattedSettings">
              <p><strong>Message history appended.</strong></p>
            </div>
          `;
        
          displayMessage(messageBlock, formattedSettings, settings);

      } catch (error) {
        console.error("Error processing message history:", error);
      }
    }
    
    const updatedContent = existingContent + '\n' + markdownContent;

    // Save the updated content back to the active file
    await app.vault.modify(activeFile, updatedContent);
    new Notice("Appended conversation.");
  }
  else {
    new Notice("No active Markdown file detected.");
  }
}


// `/save` to save current chat history to a note.
export async function commandSave(settings: BMOSettings) {

  let folderName = settings.chatHistory.chatHistoryPath;
  // Check if the folder exists, create it if not
  if (!await app.vault.adapter.exists(folderName)) {
    await app.vault.createFolder(folderName);
  }
  const baseFileName = 'Chat History';
  const fileExtension = '.md';

  if (folderName && !folderName.endsWith('/')) {
    folderName += '/';
  }
  
  // Create a datetime string to append to the file name
  const now = new Date();
  const dateTimeStamp = now.getFullYear() + "-" 
                        + (now.getMonth() + 1).toString().padStart(2, '0') + "-" 
                        + now.getDate().toString().padStart(2, '0') + " " 
                        + now.getHours().toString().padStart(2, '0') + "-" 
                        + now.getMinutes().toString().padStart(2, '0') + "-" 
                        + now.getSeconds().toString().padStart(2, '0');

  try {
    let markdownContent = '';
    const allFiles = app.vault.getFiles(); // Retrieve all files from the vault

    // Retrieve model name
    const modelNameElement = document.querySelector('#modelName') as HTMLHeadingElement;
    let modelName = 'Unknown'; // Default model name
    if (modelNameElement && modelNameElement.textContent) {
        modelName = modelNameElement.textContent.replace('Model: ', '').toLowerCase();
    }

    const templateFile = allFiles.find(file => file.path.toLowerCase() === settings.chatHistory.templateFilePath.toLowerCase());

    if (templateFile) {
      let fileContent = await app.vault.read(templateFile);
  
      // Check if the file content has YAML front matter
      if (/^---\s*[\s\S]*?---/.test(fileContent)) {
          // Insert model name into existing front matter
          fileContent = fileContent.replace(/^---/, `---\nmodel: ${modelName}`);
      } else {
          // Prepend new front matter
          fileContent = `---
  model: ${modelName}
---\n` + fileContent;
      }
      markdownContent += fileContent;
  } else {
      // YAML front matter
      markdownContent += 
      `---
  model: ${modelName}
---\n`;
  }

    // Retrieve user and chatbot names
    const userNames = document.querySelectorAll('.userName') as NodeListOf<HTMLHeadingElement>;

    let userNameText = 'USER';
    if (userNames.length > 0) {
        const userNameNode = userNames[0];
        Array.from(userNameNode.childNodes).forEach((node) => {
            // Check if the node is a text node and its textContent is not null
            if (node.nodeType === Node.TEXT_NODE && node.textContent) {
                userNameText = node.textContent.trim().toUpperCase();
            }
        });
    }

    // const chatbotNames = document.querySelectorAll('#chatbotName') as NodeListOf<HTMLHeadingElement>;
    const chatbotNames = document.querySelectorAll('.chatbotName') as NodeListOf<HTMLHeadingElement>;
    const chatbotNameText = chatbotNames.length > 0 && chatbotNames[0].textContent ? chatbotNames[0].textContent.toUpperCase() : 'ASSISTANT';

    // Check and read the JSON file
    if (await app.vault.adapter.exists(filenameMessageHistoryJSON)) {
      try {
        const jsonContent = await this.app.vault.adapter.read(filenameMessageHistoryJSON);
        const messages = JSON.parse(jsonContent);

        // Filter out messages starting with '/', and the assistant's response immediately following it
        let skipNext = false;
        markdownContent += messages
          .filter((message: { role: string; content: string; }, index: number, array: string | any[]) => {
            if (skipNext && message.role === 'assistant') {
              skipNext = false;
              return false;
            }
            if (message.content.startsWith('/')) {
              // Check if next message is also from user and starts with '/'
              skipNext = index + 1 < array.length && array[index + 1].role === 'assistant';
              return false;
            }
            return true;
          })
          .map((message: { role: string; content: string; }) => {
            let roleText = message.role.toUpperCase();
            roleText = roleText === 'USER' ? userNameText : roleText;
            roleText = roleText === 'ASSISTANT' ? chatbotNameText : roleText;
            return `###### ${roleText}\n${message.content}\n`;
          })
          .join('\n');

          const messageBlock = createBotMessage(settings);

          const formattedSettings = `
            <div class="formattedSettings">
              <p><strong>Message history saved.</strong></p>
            </div>
          `;
        
          displayMessage(messageBlock, formattedSettings, settings);

      } catch (error) {
        console.error("Error processing message history:", error);
      }
    }

    let fileName = '';

    if (settings.chatHistory.allowRenameNoteTitle) {
      let uniqueNameFound = false;
      let modelRenameTitle;

      // Function to check if a file name already exists
      const fileNameExists = (name: string | null) => {
          return allFiles.some((file) => file.path === folderName + name + fileExtension);
      };
    
      while (!uniqueNameFound) {
          modelRenameTitle = await fetchModelRenameTitle(settings,  markdownContent);
      
          if (!fileNameExists(modelRenameTitle)) {
              uniqueNameFound = true;
          }
      }

      fileName = folderName + modelRenameTitle + fileExtension;
      
    }
    else {
      fileName = folderName + baseFileName + ' ' + dateTimeStamp + fileExtension;
    }

    // Create the new note with formatted Markdown content
    const file = await app.vault.create(fileName, markdownContent);
    if (file) {
      new Notice("Saved conversation.");

      // Open the newly created note in a new pane
      app.workspace.openLinkText(fileName, '', true, { active: true });
    }
  } catch (error) {
    console.error('Failed to create note:', error);
  }
}

// `/stop` to stop fetching response
export function commandStop() {
  const controller = getAbortController();
  if (controller) {
      controller.abort();
  }
}

export async function removeMessageThread(index: number) {
  const messageContainer = document.querySelector('#messageContainer');

  const divElements = messageContainer?.querySelectorAll('div.botMessage, div.userMessage');

  if (divElements && divElements.length > 0 && index >= 0 && index < divElements.length) {
    for (let i = index; i < divElements.length; i++) {
      messageContainer?.removeChild(divElements[i]);
    }
  }

  messageHistory.splice(index);
  const jsonString = JSON.stringify(messageHistory, null, 4);

  try {
      await app.vault.adapter.write(filenameMessageHistoryJSON, jsonString);
  } catch (error) {
      console.error('Error writing messageHistory.json', error);
  }
}