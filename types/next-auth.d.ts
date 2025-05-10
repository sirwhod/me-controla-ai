declare module "next-auth" {
  interface Session {
    firebaseIdToken?: string;
  }
  interface User {
    firebaseIdToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    firebaseIdToken?: string;
  }
}