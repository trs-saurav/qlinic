export const authConfig = {
  pages: {
    signIn: '/sign-in',
    error: '/auth/error',
  },
  // Authorization is fully handled in src/middleware.js to avoid duplication.
  providers: [],
}
