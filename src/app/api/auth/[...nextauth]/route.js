// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth" // Refers to src/auth.js

export const { GET, POST } = handlers