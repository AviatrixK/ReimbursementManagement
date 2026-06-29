import { AuthService } from "../services/auth.service.js";

export class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await AuthService.register({ email, password });
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token } = await AuthService.login({ email, password });

      // Set cookie options
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matching standard dev settings)
      };

      res.cookie("auth_token", token, cookieOptions);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      res.clearCookie("auth_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  }
}
