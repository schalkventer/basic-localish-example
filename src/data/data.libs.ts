import { type $brand } from "zod";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { QueryClient } from "@tanstack/react-query";
import { getSingle } from "./data.api";

import {
  parseLoadSubsetOptions,
  type QueryCollectionUtils,
} from "@tanstack/query-db-collection";

import {
  BrowserCollectionCoordinator,
  createBrowserWASQLitePersistence,
  openBrowserWASQLiteOPFSDatabase,
  persistedCollectionOptions,
} from "@tanstack/browser-db-sqlite-persistence";

export const queryClient = new QueryClient();

export const LOCAL_STORAGE_KEY = "c788940e-7d0c-46d2-bde7-de8a8d29f2e2";

export const persister = createAsyncStoragePersister({
  storage: window.localStorage,
});

const database = await openBrowserWASQLiteOPFSDatabase({
  databaseName: `${LOCAL_STORAGE_KEY}.sqlite`,
});

const coordinator = new BrowserCollectionCoordinator({
  dbName: `${LOCAL_STORAGE_KEY}.coordinator`,
});

export const persistence = createBrowserWASQLitePersistence({
  database,
  coordinator,
});

export type Recipe = {
  id: string & $brand<"RECIPE_ID">;
  category: string | null;
  title: string;
  image: string;
  author: string | null;
  ingredients: null | string[];
  instructions: null | string[];
  times: {
    prep: number | null;
    cook: number | null;
    total: number | null;
  };
};

export const collection = createCollection(
  persistedCollectionOptions<Recipe, Recipe["id"]>({
    persistence,
    ...queryCollectionOptions({
      id: "recipes",
      queryClient,
      syncMode: "on-demand",
      getKey: (x) => x.id,
      refetchInterval: 20 * 1000,

      queryKey: (options) => {
        const { filters } = parseLoadSubsetOptions(options);

        const { value: id } = filters?.find(
          (x) => x.operator === "eq" && x.field[0] === "id",
        ) || { value: null };

        return ["recipes", id];
      },

      queryFn: async (ctx): Promise<Recipe[]> => {
        const selected = ctx.queryKey[1] as string | null;
        const response = await getSingle({ id: selected! });

        const inner: Recipe = {
          id: response.id,
          author: response.author,
          category: response.category,
          title: response.title,
          image: response.image_url,
          ingredients: response.ingredients,
          instructions: response.instructions,
          times: {
            cook: response.cook_time,
            prep: response.prep_time,
            total: response.total_time,
          },
        };

        return [inner];
      },

      onDelete: async (_) => {},
      onInsert: async (_) => {},
      onUpdate: async (_) => {},
    }),
  }),
);

export const utils = collection.utils as QueryCollectionUtils<Recipe>;
