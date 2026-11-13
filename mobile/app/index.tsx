import { Redirect } from 'expo-router';

// Auth wiring arrives with the auth subtask; the shell starts on the garden.
export default function Index() {
  return <Redirect href="/(app)/garden" />;
}
