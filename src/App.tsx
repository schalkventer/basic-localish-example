import { type $brand } from "zod";
import { useState, useRef } from "react";
import { useListRecipes, useSingleRecipe } from "./data";

const PAGINATION = 20;

export const App = () => {
  const debouncing = useRef<number | null>(null);

  const [debounced, setDebounced] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [selected, setSelected] = useState<
    null | (string & $brand<"RECIPE_ID">)
  >(null);

  const viewing = useSingleRecipe(selected);
  const { list, getNextPage } = useListRecipes({ search: debounced });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    if (debouncing.current) clearTimeout(debouncing.current);

    debouncing.current = window.setTimeout(() => {
      setDebounced(event.target.value);
    }, 2000);
  };

  return (
    <>
      <input placeholder="Search" onChange={handleSearch} value={search} />

      <ul>
        {!list &&
          new Array(PAGINATION).fill(null).map((_, index) => {
            return <li key={index}>Loading...</li>;
          })}

        {list?.map((item) => {
          if (!item) return <li>Loading...</li>;

          return (
            <li key={item.id}>
              <button
                onClick={() => {
                  setSelected(item.id);
                }}
              >
                {item.title}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        disabled={!getNextPage}
        onClick={() => {
          if (getNextPage) getNextPage();
        }}
      >
        LOAD MORE
      </button>

      <dialog
        open={selected !== null}
        onClick={() => setSelected(null)}
        style={{ position: "fixed", top: 100 }}
      >
        <h2>{viewing?.title}</h2>

        <div style={{ display: "flex" }}>
          <div>
            <img
              src={viewing?.image}
              alt={viewing?.title}
              width={300}
              height={300}
              style={{ objectFit: "contain" }}
            />

            <dl>
              <div>
                <dt>Category</dt>
                <dd>{viewing?.category}</dd>
              </div>

              {viewing?.times.cook && (
                <div>
                  <dt>Cook Time</dt>
                  <dd>{viewing?.times.cook}</dd>
                </div>
              )}

              {viewing?.times.total && (
                <div>
                  <dt>Total Time</dt>
                  <dd>{viewing?.times.total}</dd>
                </div>
              )}
            </dl>
          </div>

          <ul style={{ width: 300 }}>
            {!viewing?.ingredients && <li>Loading...</li>}

            {viewing?.ingredients?.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>

          <ol style={{ width: 300 }}>
            {!viewing?.instructions && <li>Loading...</li>}

            {viewing?.instructions?.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>

        <button onClick={() => setSelected(null)}>Close</button>
      </dialog>
    </>
  );
};
