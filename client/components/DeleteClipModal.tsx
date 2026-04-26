import { Button, Group, Modal, Text } from "@mantine/core";

type Props = {
  opened: boolean;
  clipName: string | undefined;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteClipModal({ opened, clipName, onClose, onConfirm }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title="Delete clip" size="sm">
      <Text mb="md">Delete &ldquo;{clipName}&rdquo;? This cannot be undone.</Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button color="red" onClick={onConfirm}>
          Delete
        </Button>
      </Group>
    </Modal>
  );
}
