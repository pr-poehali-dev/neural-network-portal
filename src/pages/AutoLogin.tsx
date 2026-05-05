import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DIANA_TOKEN = "mytoken123";
const DIANA_USER = {
  id: 1,
  email: "ddupina@inbox.ru",
  name: "Диана",
  referral_code: "diana2024",
  is_admin: true,
  bonus_generations: 0,
  free_image_generations: 1,
  free_carousel_generations: 1,
  subscription: null,
};

export default function AutoLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("auth_token", DIANA_TOKEN);
    localStorage.setItem("auth_user", JSON.stringify(DIANA_USER));
    navigate("/");
    window.location.reload();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <p>Выполняется вход...</p>
    </div>
  );
}
