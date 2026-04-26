import { Button, Group, Modal, TextInput } from "@mantine/core";

type Props = {
  opened: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function RenameClipModal({ opened, value, onChange, onClose, onConfirm }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title="Rename clip" size="sm">
      <TextInput
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onConfirm();
        }}
        data-autofocus
        mb="md"
      />
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={!value.trim()}>
          Rename
        </Button>
      </Group>
    </Modal>
  );
}
