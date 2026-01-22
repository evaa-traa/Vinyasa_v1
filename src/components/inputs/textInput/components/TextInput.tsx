import { ShortTextInput } from './ShortTextInput';
import { isMobile } from '@/utils/isMobileSignal';
import { Show, createSignal, createEffect, onMount, Setter } from 'solid-js';
import { SendButton } from '@/components/buttons/SendButton';
import { FileEvent, UploadsConfig } from '@/components/Bot';
import { ImageUploadButton } from '@/components/buttons/ImageUploadButton';
import { RecordAudioButton } from '@/components/buttons/RecordAudioButton';
import { AttachmentUploadButton } from '@/components/buttons/AttachmentUploadButton';
import { ChatInputHistory } from '@/utils/chatInputHistory';

type TextInputProps = {
  placeholder?: string;
  backgroundColor?: string;
  textColor?: string;
  sendButtonColor?: string;
  inputValue: string;
  fontSize?: number;
  disabled?: boolean;
  onSubmit: (value: string) => void;
  onInputChange: (value: string) => void;
  uploadsConfig?: Partial<UploadsConfig>;
  isFullFileUpload?: boolean;
  setPreviews: Setter<unknown[]>;
  onMicrophoneClicked: () => void;
  handleFileChange: (event: FileEvent<HTMLInputElement>) => void;
  maxChars?: number;
  maxCharsWarningMessage?: string;
  autoFocus?: boolean;
  sendMessageSound?: boolean;
  sendSoundLocation?: string;
  fullFileUploadAllowedTypes?: string;
  enableInputHistory?: boolean;
  maxHistorySize?: number;
};

const defaultBackgroundColor = '#ffffff';
const defaultTextColor = '#303235';
// CDN link for default send sound
const defaultSendSound = 'https://cdn.jsdelivr.net/gh/FlowiseAI/FlowiseChatEmbed@latest/src/assets/send_message.mp3';

export const TextInput = (props: TextInputProps) => {
  const [isSendButtonDisabled, setIsSendButtonDisabled] = createSignal(false);
  const [warningMessage, setWarningMessage] = createSignal('');
  const [inputHistory] = createSignal(new ChatInputHistory(() => props.maxHistorySize || 10));
  let inputRef: HTMLInputElement | HTMLTextAreaElement | undefined;
  let fileUploadRef: HTMLInputElement | HTMLTextAreaElement | undefined;
  let imgUploadRef: HTMLInputElement | HTMLTextAreaElement | undefined;
  let audioRef: HTMLAudioElement | undefined;

  const handleInput = (inputValue: string) => {
    const wordCount = inputValue.length;

    if (props.maxChars && wordCount > props.maxChars) {
      setWarningMessage(props.maxCharsWarningMessage ?? `You exceeded the characters limit. Please input less than ${props.maxChars} characters.`);
      setIsSendButtonDisabled(true);
      return;
    }

    props.onInputChange(inputValue);
    setWarningMessage('');
    setIsSendButtonDisabled(false);
  };

  const checkIfInputIsValid = () => warningMessage() === '' && inputRef?.reportValidity();

  const submit = () => {
    if (checkIfInputIsValid()) {
      if (props.enableInputHistory) {
        inputHistory().addToHistory(props.inputValue);
      }
      props.onSubmit(props.inputValue);
      if (props.sendMessageSound && audioRef) {
        audioRef.play();
      }
    }
  };

  const handleImageUploadClick = () => {
    if (imgUploadRef) imgUploadRef.click();
  };

  const handleFileUploadClick = () => {
    if (fileUploadRef) fileUploadRef.click();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const isIMEComposition = e.isComposing || e.keyCode === 229;
      if (!isIMEComposition) {
        e.preventDefault();
        submit();
      }
    } else if (props.enableInputHistory) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const previousInput = inputHistory().getPreviousInput(props.inputValue);
        props.onInputChange(previousInput);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextInput = inputHistory().getNextInput();
        props.onInputChange(nextInput);
      }
    }
  };

  createEffect(() => {
    const shouldAutoFocus = props.autoFocus !== undefined ? props.autoFocus : !isMobile() && window.innerWidth > 640;

    if (!props.disabled && shouldAutoFocus && inputRef) inputRef.focus();
  });

  onMount(() => {
    const shouldAutoFocus = props.autoFocus !== undefined ? props.autoFocus : !isMobile() && window.innerWidth > 640;

    if (!props.disabled && shouldAutoFocus && inputRef) inputRef.focus();

    if (props.sendMessageSound) {
      if (props.sendSoundLocation) {
        audioRef = new Audio(props.sendSoundLocation);
      } else {
        audioRef = new Audio(defaultSendSound);
      }
    }
  });

  const handleFileChange = (event: FileEvent<HTMLInputElement>) => {
    props.handleFileChange(event);
    if (event.target) event.target.value = '';
  };

  const getFileType = () => {
    if (props.isFullFileUpload) return props.fullFileUploadAllowedTypes === '' ? '*' : props.fullFileUploadAllowedTypes;
    if (props.uploadsConfig?.fileUploadSizeAndTypes?.length) {
      const allowedFileTypes = props.uploadsConfig?.fileUploadSizeAndTypes.map((allowed) => allowed.fileTypes).join(',');
      if (allowedFileTypes.includes('*')) return '*';
      else return allowedFileTypes;
    }
    return '*';
  };

  return (
    <div
      class="w-full h-auto max-h-[192px] min-h-[56px] flex flex-col items-end justify-between chatbot-input modern-input-container"
      data-testid="input"
      style={{
        margin: 'auto',
        'background-color': props.backgroundColor ?? defaultBackgroundColor,
        color: props.textColor ?? defaultTextColor,
        'border-top': '1px solid rgba(0, 0, 0, 0.05)',
        'backdrop-filter': 'blur(10px)',
        'background': 'rgba(255, 255, 255, 0.9)',
        'padding': '16px',
        'border-radius': '0 0 20px 20px',
      }}
      onKeyDown={handleKeyDown}
    >
      <Show when={warningMessage() !== ''}>
        <div class="w-full px-4 pt-4 pb-1 text-red-500 text-sm" data-testid="warning-message">
          {warningMessage()}
        </div>
      </Show>
      <div class="w-full flex items-end justify-between gap-2">
        {props.uploadsConfig?.isImageUploadAllowed ? (
          <>
            <ImageUploadButton
              buttonColor={props.sendButtonColor}
              type="button"
              class="w-10 h-10 flex items-center justify-center rounded-lg transition-all hover:bg-gray-100 active:bg-gray-200"
              isDisabled={props.disabled || isSendButtonDisabled()}
              on:click={handleImageUploadClick}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" class="text-gray-600">
                <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
            </ImageUploadButton>
            <input
              style={{ display: 'none' }}
              multiple
              ref={imgUploadRef as HTMLInputElement}
              type="file"
              onChange={handleFileChange}
              accept={
                props.uploadsConfig?.imgUploadSizeAndTypes?.length
                  ? props.uploadsConfig?.imgUploadSizeAndTypes.map((allowed) => allowed.fileTypes).join(',')
                  : '*'
              }
            />
          </>
        ) : null}
        {props.uploadsConfig?.isRAGFileUploadAllowed || props.isFullFileUpload ? (
          <>
            <AttachmentUploadButton
              buttonColor={props.sendButtonColor}
              type="button"
              class="m-0 h-14 flex items-center justify-center"
              isDisabled={props.disabled || isSendButtonDisabled()}
              on:click={handleFileUploadClick}
            >
              <span style={{ 'font-family': 'Poppins, sans-serif' }}>File Upload</span>
            </AttachmentUploadButton>
            <input
              style={{ display: 'none' }}
              multiple
              ref={fileUploadRef as HTMLInputElement}
              type="file"
              onChange={handleFileChange}
              accept={getFileType()}
            />
          </>
        ) : null}
        <ShortTextInput
          ref={inputRef as HTMLTextAreaElement}
          onInput={handleInput}
          value={props.inputValue}
          fontSize={props.fontSize}
          disabled={props.disabled}
          placeholder={props.placeholder ?? 'Type your question'}
          class="modern-input modern-font flex-1"
        />
        {props.uploadsConfig?.isSpeechToTextEnabled ? (
          <RecordAudioButton
            buttonColor={props.sendButtonColor}
            type="button"
            class="w-10 h-10 flex items-center justify-center rounded-lg transition-all hover:bg-gray-100 active:bg-gray-200"
            isDisabled={props.disabled || isSendButtonDisabled()}
            on:click={props.onMicrophoneClicked}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" class="text-gray-600">
              <path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path fill="currentColor" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </RecordAudioButton>
        ) : null}
        <SendButton
          sendButtonColor={props.sendButtonColor}
          type="button"
          isDisabled={props.disabled || isSendButtonDisabled()}
          class="modern-send-button w-10 h-10 flex items-center justify-center transition-all"
          on:click={submit}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" class="text-white">
            <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </SendButton>
      </div>
    </div>
  );
};
