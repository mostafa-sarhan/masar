import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { errorMessage } from "./services/errors";
import { isAdmin } from "./utils/roles";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, sessionError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // reset error

    try {
      const user = await login(email, password);

      if (isAdmin(user.role)) navigate("/");
      else navigate("/orders");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="w-full flex justify-center items-center h-screen bg-main">
      <form
        onSubmit={handleSubmit}
        className="bg-amber-50 rounded-lg text-center p-4 m-2 flex flex-col text-black"
      >
        <label>الايميل</label>
        <input
          type="email"
          placeholder="ادخل الايميل"
          className="border p-1 rounded-lg my-2 w-[300px]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>الباسورد</label>
        <input
          type="password"
          placeholder="الباسورد"
          className="border p-1 rounded-lg my-2 w-[300px]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {(error || sessionError) && <p className="text-red-500">{error || errorMessage(sessionError)}</p>}

        <button
          type="submit"
          className="bg-black text-white rounded-lg py-1 mt-3"
        >
          Login
        </button>
      </form>
    </div>
  );
}
