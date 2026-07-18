import { useState, useEffect } from "react";
import {
  getList,
  getSingle,
  type ListRecipeResponse,
  type SingleRecipeResponse,
} from "./data";

const PAGINATION = 20;

export const App = () => {
  const [selected, setSelected] = useState<null | string>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [list, setList] = useState<ListRecipeResponse["items"]>([]);
  const [viewing, setViewing] = useState<null | SingleRecipeResponse>(null);

  useEffect(() => {
    const init = async () => {
      if (selected === null) {
        setViewing(null);
        return;
      }

      const response = await getSingle({ id: selected });
      setViewing(response);
    };

    init();
  }, [selected]);

  // fires twice because of strict mode
  useEffect(() => {
    const init = async () => {
      const response = await getList({
        params: { limit: PAGINATION, offset: (page - 1) * PAGINATION },
      });

      setList((x) => [...x, ...response.items]);
      setHasMore(response.next_cursor !== null);
    };

    init();
  }, [page]);

  return (
    <>
      <ul>
        {list?.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => {
                setSelected(item.id);
              }}
            >
              {item.title}
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={() => {
          hasMore && setPage((prev) => prev + 1);
        }}
      >
        LOAD MORE
      </button>

      <dialog
        open={selected !== null}
        onClick={() => setSelected(null)}
        style={{ position: "fixed", top: 100 }}
      >
        <h2>{viewing?.title || list.find((x) => x.id === selected)?.title}</h2>
        {viewing === null && <p>Loading...</p>}

        {viewing !== null && (
          <div style={{ display: "flex" }}>
            <div>
              <img
                src={viewing.image_url}
                alt={viewing.title}
                width={300}
                height={300}
                style={{ objectFit: "contain" }}
              />
              <dl>
                <div>
                  <dt>Author</dt>
                  <dd>{viewing.author}</dd>
                </div>

                <div>
                  <dt>Category</dt>
                  <dd>{viewing.category}</dd>
                </div>

                {viewing.cook_time && (
                  <div>
                    <dt>Cook Time</dt>
                    <dd>{viewing.cook_time}</dd>
                  </div>
                )}

                {viewing.total_time && (
                  <div>
                    <dt>Total Time</dt>
                    <dd>{viewing.total_time}</dd>
                  </div>
                )}
              </dl>
            </div>

            <ul style={{ width: 300 }}>
              {viewing.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>

            <ol style={{ width: 300 }}>
              {viewing.instructions.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        <button onClick={() => setSelected(null)}>Close</button>
      </dialog>
    </>
  );
};
