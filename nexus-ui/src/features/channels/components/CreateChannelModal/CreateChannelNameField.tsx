interface CreateChannelNameFieldProps {
  inputId: string;
  value: string;
  onValueChange: (channelName: string) => void;
}

export function CreateChannelNameField({
  inputId,
  value,
  onValueChange,
}: CreateChannelNameFieldProps) {
  return (
    <div>
      <label htmlFor={inputId} className="label-sm mb-2 block">
        Channel Name
      </label>

      <input
        id={inputId}
        type="text"
        className="input-field"
        placeholder="e.g. quantum-protocol"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        required
        autoFocus
      />
    </div>
  );
}
