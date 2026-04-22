import LoginPage, { type LoginPageProps } from "./LoginPage";

export default function AuthScreen({ onEnter }: LoginPageProps) {
  return <LoginPage onEnter={onEnter} />;
}
