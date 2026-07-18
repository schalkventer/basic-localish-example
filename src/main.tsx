import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { queryClient, persister, LOCAL_STORAGE_KEY } from "./data";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        buster: LOCAL_STORAGE_KEY,
      }}
    >
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
);
