// Minimal Supabase query adapter for route tests. Real SQL, grants and RLS run in PGlite.
export function adapter(pg, user) {
  const ident = (v) => {
    if (!/^[a-z_]+$/.test(v)) throw Error("Invalid identifier");
    return `"${v}"`;
  };
  return {
    auth: {
      getUser: async () => ({
        data: { user: user.id ? { id: user.id } : null },
        error: null,
      }),
    },
    from(table) {
      let op = "select",
        columns = "*",
        values,
        filters = [],
        orders = [],
        range;
      const q = {
        select(c) {
          columns = c;
          return q;
        },
        insert(v) {
          op = "insert";
          values = v;
          return q;
        },
        update(v) {
          op = "update";
          values = v;
          return q;
        },
        delete() {
          op = "delete";
          return q;
        },
        eq(k, v) {
          filters.push([k, "=", v]);
          return q;
        },
        neq(k, v) {
          filters.push([k, "<>", v]);
          return q;
        },
        lte(k, v) {
          filters.push([k, "<=", v]);
          return q;
        },
        gte(k, v) {
          filters.push([k, ">=", v]);
          return q;
        },
        order(k, o = {}) {
          orders.push(`${ident(k)} ${o.ascending === false ? "desc" : "asc"}`);
          return q;
        },
        range(a, b) {
          range = [a, b - a + 1];
          return q;
        },
        limit(n) {
          range = [0, n];
          return q;
        },
        single() {
          return run(true, true);
        },
        maybeSingle() {
          return run(true, false);
        },
        then(ok, bad) {
          return run(false, false).then(ok, bad);
        },
      };
      async function run(one, required) {
        try {
          await pg.exec("reset role; set role authenticated");
          await pg.query(
            "select set_config('request.jwt.claim.sub',$1,false)",
            [user.id],
          );
          const params = [];
          const val = (v) => {
            params.push(v);
            return "$" + params.length;
          };
          const selected =
            columns === "*"
              ? "*"
              : columns
                  .split(",")
                  .map((x) => ident(x.trim()))
                  .join(",");
          let sql;
          if (op === "select")
            sql = `select ${selected} from public.${ident(table)}`;
          if (op === "delete") sql = `delete from public.${ident(table)}`;
          if (op === "insert")
            sql = `insert into public.${ident(table)} (${Object.keys(values).map(ident)}) values (${Object.values(values).map(val)})`;
          if (op === "update")
            sql = `update public.${ident(table)} set ${Object.entries(values)
              .map(([k, v]) => ident(k) + "=" + val(v))
              .join(",")}`;
          if (filters.length)
            sql +=
              " where " +
              filters
                .map(([k, o, v]) => `${ident(k)} ${o} ${val(v)}`)
                .join(" and ");
          if (op === "select") {
            if (orders.length) sql += " order by " + orders.join(",");
            if (range) sql += ` limit ${range[1]} offset ${range[0]}`;
          } else sql += " returning " + selected;
          const { rows } = await pg.query(sql, params);
          if (one && (rows.length > 1 || (required && !rows.length)))
            return { data: null, error: { code: "PGRST116" } };
          return { data: one ? (rows[0] ?? null) : rows, error: null };
        } catch (error) {
          return {
            data: null,
            error: { code: error.code, message: error.message },
          };
        }
      }
      return q;
    },
  };
}
