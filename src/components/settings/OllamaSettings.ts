import { Setting, SettingTab, setIcon } from "obsidian";
import BMOGPT, { DEFAULT_SETTINGS } from "src/main";
import { addDescriptionLink } from "src/utils/DescriptionLink";

// Ollama Settings
export function addOllamaSettings(containerEl: HTMLElement, plugin: BMOGPT, SettingTab: SettingTab) {
    const toggleSettingContainer = containerEl.createDiv({ cls: 'toggleSettingContainer' });
    toggleSettingContainer.createEl('h2', {text: 'Ollama Local LLMs'});

    const initialState = plugin.settings.toggleOllamaSettings;
    const chevronIcon = toggleSettingContainer.createEl('span', { cls: 'chevron-icon' });
    setIcon(chevronIcon, initialState ? 'chevron-down' : 'chevron-right');

    // Create the settings container to be toggled
    const settingsContainer = containerEl.createDiv({ cls: 'settingsContainer' });
    settingsContainer.style.display = initialState ? 'block' : 'none';

    // Toggle visibility
    toggleSettingContainer.addEventListener('click', async () => {
        const isOpen = settingsContainer.style.display !== 'none';
        if (isOpen) {
            setIcon(chevronIcon, 'chevron-right'); // Close state
            settingsContainer.style.display = 'none';
            plugin.settings.toggleOllamaSettings = false;

        } else {
            setIcon(chevronIcon, 'chevron-down'); // Open state
            settingsContainer.style.display = 'block';
            plugin.settings.toggleOllamaSettings = true;
        }
        await plugin.saveSettings();
    });

    new Setting(settingsContainer)
        .setName('OLLAMA REST API URL')
        .setDesc(addDescriptionLink('Enter your REST API URL using', 'https://ollama.ai/', '', 'Ollama'))
        .addText(text => text
            .setPlaceholder('http://localhost:11434')
            .setValue(plugin.settings.ollamaRestAPIUrl || DEFAULT_SETTINGS.ollamaRestAPIUrl)
            .onChange(async (value) => {
                    plugin.settings.ollamaRestAPIUrl = value ? value : DEFAULT_SETTINGS.ollamaRestAPIUrl;
                    await plugin.saveSettings();
                })
            .inputEl.addEventListener('focusout', async () => {
                SettingTab.display();
            })
        );

    new Setting(settingsContainer)
        .setName('Allow Stream')
        .setDesc(addDescriptionLink('Allow Ollama models to stream response. Additional setup required: ', 'https://github.com/longy2k/obsidian-bmo-chatbot/wiki/How-to-setup-with-Ollama', '', '[Instructions]'))
        .addToggle((toggle) =>
            toggle.setValue(plugin.settings.allowOllamaStream).onChange((value) => {
                plugin.settings.allowOllamaStream = value;
                plugin.saveSettings();
            })
        );

    // Create the toggle container for Advanced Settings within the main settingsContainer
    const advancedToggleSettingContainer = settingsContainer.createDiv({ cls: 'toggleSettingContainer' });
    advancedToggleSettingContainer.createEl('h2', { text: 'Advanced Settings' });

    // Determine the initial state for Advanced Settings from the plugin's settings
    const advancedInitialState = plugin.settings.toggleAdvancedSettings;
    const advancedChevronIcon = advancedToggleSettingContainer.createEl('span', { cls: 'chevron-icon' });
    setIcon(advancedChevronIcon, advancedInitialState ? 'chevron-down' : 'chevron-right');

    // Create the container for Advanced Settings that will be toggled
    const advancedSettingsContainer = settingsContainer.createDiv({ cls: 'settingsContainer' });
    advancedSettingsContainer.style.display = advancedInitialState ? 'block' : 'none';

    // Toggle visibility for Advanced Settings
    advancedToggleSettingContainer.addEventListener('click', async () => {
        const isOpen = advancedSettingsContainer.style.display !== 'none';
        if (isOpen) {
            setIcon(advancedChevronIcon, 'chevron-right'); // Close state
            advancedSettingsContainer.style.display = 'none';
            plugin.settings.toggleAdvancedSettings = false;
        } else {
            setIcon(advancedChevronIcon, 'chevron-down'); // Open state
            advancedSettingsContainer.style.display = 'block';
            plugin.settings.toggleAdvancedSettings = true;
        }
        await plugin.saveSettings();
    });


    new Setting(advancedSettingsContainer)
        .setName('mirostat')
        .setDesc('Enable Mirostat sampling for controlling perplexity. (default: 0, 0 = disabled, 1 = Mirostat, 2 = Mirostat 2.0)')
        .addText(text => text
            .setPlaceholder('0')
            .setValue(plugin.settings.ollamaParameters.mirostat || DEFAULT_SETTINGS.ollamaParameters.mirostat)
            .onChange(async (value) => {
                // Parse the input value as an integer
                const intValue = parseInt(value, 10); // 10 is the radix parameter to ensure parsing is done in base 10
                
                // Check if the parsed value is a valid integer, if not, fallback to the default URL
                if (isNaN(intValue)) {
                    plugin.settings.ollamaParameters.mirostat = DEFAULT_SETTINGS.ollamaParameters.mirostat;
                } else {
                    plugin.settings.ollamaParameters.mirostat = intValue.toString();
                }
    
                await plugin.saveSettings();
            })
            .inputEl.addEventListener('focusout', async () => {
                SettingTab.display();
            })
        );

    new Setting(advancedSettingsContainer)
    .setName('mirostat_eta')
    .setDesc('Influences how quickly the algorithm responds to feedback from the generated text. A lower learning rate will result in slower adjustments, while a higher learning rate will make the algorithm more responsive. (Default: 0.1)')
    .addText(text => text
        .setPlaceholder('0.1')
        .setValue(plugin.settings.ollamaParameters.mirostat_eta || DEFAULT_SETTINGS.ollamaParameters.mirostat_eta)
        .onChange(async (value) => {
            // Parse the input value as an integer
            const floatValue = parseFloat(value); // 10 is the radix parameter to ensure parsing is done in base 10
            
            // Determine if the float value is an integer (whole number)
            if (!isNaN(floatValue)) {
                if (parseInt(value) === floatValue) {
                    // If it's a whole number, append '.0' to make it explicitly a float
                    plugin.settings.ollamaParameters.mirostat_eta = floatValue + ".0";
                } else {
                    // It's already a float, so just use it directly
                    plugin.settings.ollamaParameters.mirostat_eta = floatValue.toString();
                }
            } else {
                // Fallback to the default value if input is not a valid number
                plugin.settings.ollamaParameters.mirostat_eta = DEFAULT_SETTINGS.ollamaParameters.mirostat_eta;
            }

            await plugin.saveSettings();
        })
        .inputEl.addEventListener('focusout', async () => {
            SettingTab.display();
        })
    );

    new Setting(advancedSettingsContainer)
    .setName('mirostat_tau')
    .setDesc('Controls the balance between coherence and diversity of the output. A lower value will result in more focused and coherent text. (Default: 5.0)')
    .addText(text => text
        .setPlaceholder('5.0')
        .setValue(plugin.settings.ollamaParameters.mirostat_tau || DEFAULT_SETTINGS.ollamaParameters.mirostat_tau)
        .onChange(async (value) => {
            // Parse the input value as an integer
            const floatValue = parseFloat(value); // 10 is the radix parameter to ensure parsing is done in base 10
            
            // Determine if the float value is an integer (whole number)
            if (!isNaN(floatValue)) {
                if (parseInt(value) === floatValue) {
                    // If it's a whole number, append '.0' to make it explicitly a float
                    plugin.settings.ollamaParameters.mirostat_tau = floatValue + ".0";
                } else {
                    // It's already a float, so just use it directly
                    plugin.settings.ollamaParameters.mirostat_tau = floatValue.toString();
                }
            } else {
                // Fallback to the default value if input is not a valid number
                plugin.settings.ollamaParameters.mirostat_tau = DEFAULT_SETTINGS.ollamaParameters.mirostat_tau;
            }

            await plugin.saveSettings();
        })
        .inputEl.addEventListener('focusout', async () => {
            SettingTab.display();
        })
    );

    new Setting(advancedSettingsContainer)
    .setName('num_ctx')
    .setDesc('Sets the size of the context window used to generate the next token. (Default: 2048)')
    .addText(text => text
        .setPlaceholder('2048')
        .setValue(plugin.settings.ollamaParameters.num_ctx || DEFAULT_SETTINGS.ollamaParameters.num_ctx)
        .onChange(async (value) => {
            // Parse the input value as an integer
            const intValue = parseInt(value, 10); // 10 is the radix parameter to ensure parsing is done in base 10
            
            // Check if the parsed value is a valid integer, if not, fallback to the default URL
            if (isNaN(intValue)) {
                plugin.settings.ollamaParameters.num_ctx = DEFAULT_SETTINGS.ollamaParameters.num_ctx;
            } else {
                plugin.settings.ollamaParameters.num_ctx = intValue.toString();
            }

            await plugin.saveSettings();
        })
        .inputEl.addEventListener('focusout', async () => {
            SettingTab.display();
        })
    );

    new Setting(advancedSettingsContainer)
    .setName('num_gqa')
    .setDesc('The number of GQA groups in the transformer layer. Required for some models, for example it is 8 for llama2:70b.')
    .addText(text => text
        .setPlaceholder('0')
        .setValue(plugin.settings.ollamaParameters.num_gqa || DEFAULT_SETTINGS.ollamaParameters.num_gqa)
        .onChange(async (value) => {
            // Parse the input value as an integer
            const intValue = parseInt(value, 10); // 10 is the radix parameter to ensure parsing is done in base 10
            
            // Check if the parsed value is a valid integer, if not, fallback to the default URL
            if (isNaN(intValue)) {
                plugin.settings.ollamaParameters.num_gqa = DEFAULT_SETTINGS.ollamaParameters.num_gqa;
            } else {
                plugin.settings.ollamaParameters.num_gqa = intValue.toString();
            }

            await plugin.saveSettings();
        })
        .inputEl.addEventListener('focusout', async () => {
            SettingTab.display();
        })
    );

    new Setting(advancedSettingsContainer)
    .setName('num_thread')
    .setDesc('Sets the number of threads to use during computation. By default, Ollama will detect this for optimal performance. It is recommended to set this value to the number of physical CPU cores your system has (as opposed to the logical number of cores).')
    .addText(text => text
        .setPlaceholder('0')
        .setValue(plugin.settings.ollamaParameters.num_thread || DEFAULT_SETTINGS.ollamaParameters.num_thread)
        .onChange(async (value) => {
            // Parse the input value as an integer
            const intValue = parseInt(value, 10); // 10 is the radix parameter to ensure parsing is done in base 10
            
            // Check if the parsed value is a valid integer, if not, fallback to the default URL
            if (isNaN(intValue)) {
                plugin.settings.ollamaParameters.num_thread = DEFAULT_SETTINGS.ollamaParameters.num_thread;
            } else {
                plugin.settings.ollamaParameters.num_thread = intValue.toString();
            }

            await plugin.saveSettings();
        })
        .inputEl.addEventListener('focusout', async () => {
            SettingTab.display();
        })
    );

    new Setting(advancedSettingsContainer)
    .setName('repeat_last_n')
    .setDesc('Sets how far back for the model to look back to prevent repetition. (Default: 64, 0 = disabled, -1 = num_ctx)')
    .addText(text => text
        .setPlaceholder('64')
        .setValue(plugin.settings.ollamaParameters.repeat_last_n || DEFAULT_SETTINGS.ollamaParameters.repeat_last_n)
        .onChange(async (value) => {
            // Parse the input value as an integer
            const intValue = parseInt(value, 10); // 10 is the radix parameter to ensure parsing is done in base 10
            
            // Check if the parsed value is a valid integer, if not, fallback to the default URL
            if (isNaN(intValue)) {
                plugin.settings.ollamaParameters.repeat_last_n = DEFAULT_SETTINGS.ollamaParameters.repeat_last_n;
            } else {
                plugin.settings.ollamaParameters.repeat_last_n = intValue.toString();
            }

            await plugin.saveSettings();
        })
        .inputEl.addEventListener('focusout', async () => {
            SettingTab.display();
        })
    );

    new Setting(advancedSettingsContainer)
    .setName('repeat_penalty')
    .setDesc('Sets how strongly to penalize repetitions. A higher value (e.g., 1.5) will penalize repetitions more strongly, while a lower value (e.g., 0.9) will be more lenient. (Default: 1.1)')
    .addText(text => text
        .setPlaceholder('1.1')
        .setValue(plugin.settings.ollamaParameters.repeat_penalty || DEFAULT_SETTINGS.ollamaParameters.repeat_penalty)
        .onChange(async (value) => {
            // Parse the input value as an integer
            const floatValue = parseFloat(value); // 10 is the radix parameter to ensure parsing is done in base 10
            
            // Determine if the float value is an integer (whole number)
            if (!isNaN(floatValue)) {
                if (parseInt(value) === floatValue) {
                    // If it's a whole number, append '.0' to make it explicitly a float
                    plugin.settings.ollamaParameters.repeat_penalty = floatValue + ".0";
                } else {
                    // It's already a float, so just use it directly
                    plugin.settings.ollamaParameters.repeat_penalty = floatValue.toString();
                }
            } else {
                // Fallback to the default value if input is not a valid number
                plugin.settings.ollamaParameters.repeat_penalty = DEFAULT_SETTINGS.ollamaParameters.repeat_penalty;
            }

            await plugin.saveSettings();
        })
        .inputEl.addEventListener('focusout', async () => {
            SettingTab.display();
        })
    );

    new Setting(advancedSettingsContainer)
    .setName('seed')
    .setDesc('Sets the random number seed to use for generation. Setting this to a specific number will make the model generate the same text for the same prompt.')
    .addText(text => text
        .setPlaceholder('0')
        .setValue(plugin.settings.ollamaParameters.seed || DEFAULT_SETTINGS.ollamaParameters.seed)
        .onChange(async (value) => {
            // Parse the input value as an integer
            const intValue = parseInt(value, 10); // 10 is the radix parameter to ensure parsing is done in base 10
            
            // Check if the parsed value is a valid integer, if not, fallback to the default URL
            if (isNaN(intValue)) {
                plugin.settings.ollamaParameters.seed = DEFAULT_SETTINGS.ollamaParameters.seed;
            } else {
                plugin.settings.ollamaParameters.seed = intValue.toString();
            }

            await plugin.saveSettings();
        })
        .inputEl.addEventListener('focusout', async () => {
            SettingTab.display();
        })
    );

    new Setting(advancedSettingsContainer)
    .setName('stop')
    .setDesc('Sets the stop sequences to use. When this pattern is encountered, the LLM will stop generating text and return. Multiple stop patterns may be set by specifying them as a comma-separated list in the input field.')
    .addText(text => text
        .setPlaceholder('stop, \\n, user:')
        .setValue(plugin.settings.ollamaParameters.stop && Array.isArray(plugin.settings.ollamaParameters.stop) 
                   ? plugin.settings.ollamaParameters.stop.join(", ") 
                   : DEFAULT_SETTINGS.ollamaParameters.stop.join(", "))
        .onChange(async (value) => {
                // Split the input string by commas, trim whitespace, and ensure it's always stored as an array
                const stopsArray = value ? value.split(',').map(s => s.trim()) : [...DEFAULT_SETTINGS.ollamaParameters.stop];
                plugin.settings.ollamaParameters.stop = stopsArray;
                await plugin.saveSettings();
            })
        .inputEl.addEventListener('focusout', async () => {
            SettingTab.display();
        })
    );
    
    

    new Setting(advancedSettingsContainer)
    .setName('tfs_z')
    .setDesc('Tail free sampling is used to reduce the impact of less probable tokens from the output. A higher value (e.g., 2.0) will reduce the impact more, while a value of 1.0 disables this setting. (default: 1)')
    .addText(text => text
        .setPlaceholder('1.0')
        .setValue(plugin.settings.ollamaParameters.tfs_z || DEFAULT_SETTINGS.ollamaParameters.tfs_z)
        .onChange(async (value) => {
            // Parse the input value as an integer
            const floatValue = parseFloat(value); // 10 is the radix parameter to ensure parsing is done in base 10
            
            // Determine if the float value is an integer (whole number)
            if (!isNaN(floatValue)) {
                if (parseInt(value) === floatValue) {
                    // If it's a whole number, append '.0' to make it explicitly a float
                    plugin.settings.ollamaParameters.tfs_z = floatValue + ".0";
                } else {
                    // It's already a float, so just use it directly
                    plugin.settings.ollamaParameters.tfs_z = floatValue.toString();
                }
            } else {
                // Fallback to the default value if input is not a valid number
                plugin.settings.ollamaParameters.tfs_z = DEFAULT_SETTINGS.ollamaParameters.tfs_z;
            }

            await plugin.saveSettings();
        })
        .inputEl.addEventListener('focusout', async () => {
            SettingTab.display();
        })
    );

    new Setting(advancedSettingsContainer)
    .setName('top_k')
    .setDesc('Reduces the probability of generating nonsense. A higher value (e.g. 100) will give more diverse answers, while a lower value (e.g. 10) will be more conservative. (Default: 40)')
    .addText(text => text
        .setPlaceholder('40')
        .setValue(plugin.settings.ollamaParameters.top_k || DEFAULT_SETTINGS.ollamaParameters.top_k)
        .onChange(async (value) => {
            // Parse the input value as an integer
            const intValue = parseInt(value, 10); // 10 is the radix parameter to ensure parsing is done in base 10
            
            // Check if the parsed value is a valid integer, if not, fallback to the default URL
            if (isNaN(intValue)) {
                plugin.settings.ollamaParameters.top_k = DEFAULT_SETTINGS.ollamaParameters.top_k;
            } else {
                plugin.settings.ollamaParameters.top_k = intValue.toString();
            }

            await plugin.saveSettings();
        })
        .inputEl.addEventListener('focusout', async () => {
            SettingTab.display();
        })
    );

    new Setting(advancedSettingsContainer)
    .setName('top_p')
    .setDesc('Works together with top-k. A higher value (e.g., 0.95) will lead to more diverse text, while a lower value (e.g., 0.5) will generate more focused and conservative text. (Default: 0.9)')
    .addText(text => text
        .setPlaceholder('1.0')
        .setValue(plugin.settings.ollamaParameters.top_p || DEFAULT_SETTINGS.ollamaParameters.top_p)
        .onChange(async (value) => {
            // Parse the input value as an integer
            const floatValue = parseFloat(value); // 10 is the radix parameter to ensure parsing is done in base 10
            
            // Determine if the float value is an integer (whole number)
            if (!isNaN(floatValue)) {
                if (parseInt(value) === floatValue) {
                    // If it's a whole number, append '.0' to make it explicitly a float
                    plugin.settings.ollamaParameters.top_p = floatValue + ".0";
                } else {
                    // It's already a float, so just use it directly
                    plugin.settings.ollamaParameters.top_p = floatValue.toString();
                }
            } else {
                // Fallback to the default value if input is not a valid number
                plugin.settings.ollamaParameters.top_p = DEFAULT_SETTINGS.ollamaParameters.top_p;
            }

            await plugin.saveSettings();
        })
        .inputEl.addEventListener('focusout', async () => {
            SettingTab.display();
        })
    );

}