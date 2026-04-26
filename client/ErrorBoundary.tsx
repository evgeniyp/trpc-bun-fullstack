import { Alert, Button, Stack } from "@mantine/core";
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  override render() {
    if (this.state.error) {
      return (
        <Stack p="md">
          <Alert color="red" title="Something went wrong">
            {this.state.error.message}
          </Alert>
          <Button onClick={this.reset}>Try again</Button>
        </Stack>
      );
    }
    return this.props.children;
  }
}
