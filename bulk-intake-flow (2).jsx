import { useState, useRef, useEffect } from "react";

// ── Data ─────────────────────────────────────────────────────────────────────
const BRANDS = ["Zara","H&M","Levi's","Mango","COS","Massimo Dutti","& Other Stories","Arket","Weekday","Uniqlo","Nike","Adidas"];
const CATEGORIES = ["Dress","Top","Pants","Skirt","Outerwear","Shoes","Bag","Accessory","Knitwear","Swimwear"];
const SIZES = ["XXS","XS","S","M","L","XL","XXL","26","28","30","32","34","36","38","40","42","44"];
const COLORS = [
  { name:"Black",hex:"#222" },{ name:"White",hex:"#f5f5f5" },{ name:"Navy",hex:"#1e3a5f" },
  { name:"Grey",hex:"#999" },{ name:"Beige",hex:"#d4c5a9" },{ name:"Brown",hex:"#6b4226" },
  { name:"Red",hex:"#c0392b" },{ name:"Blue",hex:"#2980b9" },{ name:"Green",hex:"#27ae60" },{ name:"Pink",hex:"#e91e8a" },
];
const COLOR_MAP = Object.fromEntries(COLORS.map(c => [c.name, c.hex]));
const BRAND_TIER = {"H&M":0,"Zara":0,"Mango":0,"Weekday":0,"Uniqlo":0,"Levi's":1,"Nike":1,"Adidas":1,"COS":1,"Massimo Dutti":2,"& Other Stories":2,"Arket":2};
const TIER_LBL = ["FAST FASHION","MID","PREMIUM"];
const PRICES = [4.90,9.90,14.90,19.90,29.90,39.90,49.90,69.90,89.90,129.90,179.90,249.90];
const DARK_COLORS = ["Black","Navy","Brown"];
const VIEW = { SETUP: "setup", LIST: "list", ADD: "add", EDIT: "edit" };

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState(VIEW.SETUP);
  const [tpl, setTpl] = useState({ brand:"", category:"", photosOn:true, autoName:false, autoNamePrefix:"" });
  const [items, setItems] = useState([]);
  const [editId, setEditId] = useState(null);
  const [published, setPublished] = useState(false);

  const ok = tpl.brand && tpl.category;
  const total = items.reduce((s, i) => s + Number(i.price || 0), 0);

  const actions = {
    upTpl: (f, v) => setTpl(p => ({ ...p, [f]: v })),
    addItem: (it) => { setItems(p => [...p, { ...it, id: Date.now() + Math.random() }]); },
    updateItem: (id, data) => { setItems(p => p.map(i => i.id === id ? { ...i, ...data } : i)); setView(VIEW.LIST); },
    rmItem: (id) => setItems(p => p.filter(i => i.id !== id)),
    startEdit: (id) => { setEditId(id); setView(VIEW.EDIT); },
    pub: () => setPublished(true),
    reset: () => { setView(VIEW.SETUP); setTpl({ brand:"",category:"",photosOn:true,autoName:false,autoNamePrefix:"" }); setItems([]); setPublished(false); setEditId(null); },
  };

  const nav = {
    [VIEW.SETUP]: { title: "Configure Template", fwd: ok ? { label: "Items →", go: () => setView(VIEW.LIST) } : null },
    [VIEW.LIST]: { title: "Items", back: { label: "Configure", go: () => setView(VIEW.SETUP) }, fwd: items.length > 0 ? { label: `Publish ${items.length}`, go: actions.pub } : null },
    [VIEW.ADD]: { title: "Add item", back: { label: "Items", go: () => setView(VIEW.LIST) } },
    [VIEW.EDIT]: { title: "Edit item", back: { label: "Items", go: () => setView(VIEW.LIST) } },
  };

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      {!published ? <NavBar {...(nav[view] || {})} /> : <NavBar title="Published" />}
      <div style={S.body}>
        {view === VIEW.SETUP && !published && <Setup t={tpl} up={actions.upTpl} ok={ok} go={() => setView(VIEW.LIST)} />}
        {view === VIEW.LIST && !published && <ItemList t={tpl} items={items} edit={actions.startEdit} goAdd={() => setView(VIEW.ADD)} />}
        {view === VIEW.ADD && !published && <AddItem t={tpl} items={items} onAdd={actions.addItem} onDone={() => setView(VIEW.LIST)} />}
        {view === VIEW.EDIT && !published && editId && (
          <EditItem
            item={items.find(i => i.id === editId)}
            onSave={data => actions.updateItem(editId, data)}
            onDelete={() => { actions.rmItem(editId); setView(VIEW.LIST); }}
          />
        )}
        {published && <Done t={tpl} items={items} total={total} reset={actions.reset} />}
      </div>
    </div>
  );
}

// ── Nav Bar ──────────────────────────────────────────────────────────────────
function NavBar({ title = "", back, fwd }) {
  return (
    <div style={S.appBar}>
      <div style={S.barSide}>{back && <button className="ch" onClick={back.go} style={S.barBack}>← {back.label}</button>}</div>
      <span style={S.barTitle}>{title}</span>
      <div style={{ ...S.barSide, justifyContent: "flex-end" }}>{fwd && <button className="ch" onClick={fwd.go} style={S.barFwd}>{fwd.label}</button>}</div>
    </div>
  );
}

// ── Setup ────────────────────────────────────────────────────────────────────
function Setup({ t, up, ok, go }) {
  const tier = BRAND_TIER[t.brand] ?? 0;
  return (
    <div style={S.scroll}>
      <div style={{ ...S.sub, marginBottom: 16 }}>Shared across all items in this batch</div>

      <Field label="Brand" req>
        <Chips items={BRANDS} value={t.brand} onPick={v => up("brand", v)} />
        {t.brand && <div className="fi" style={{ marginTop: 5 }}><Pill bg="#eef2ff" c="#4f46e5">{TIER_LBL[tier]}</Pill></div>}
      </Field>

      <Field label="Category" req>
        <Chips items={CATEGORIES} value={t.category} onPick={v => up("category", v)} />
      </Field>

      <Toggle label="Photos" sub="Capture per item" on={t.photosOn} toggle={() => up("photosOn", !t.photosOn)} />
      <Toggle label="Auto-name" sub="Pre-fill with increment" on={t.autoName} toggle={() => up("autoName", !t.autoName)} />

      {t.autoName && (
        <div className="fi" style={{ marginTop: 8 }}>
          <Field label="Name prefix">
            <input type="text" value={t.autoNamePrefix} onChange={e => up("autoNamePrefix", e.target.value)} placeholder={t.category || "Item"} style={S.input} />
            <div style={{ ...S.sub, marginTop: 4 }}>Preview: <b>{t.autoNamePrefix || t.category || "Item"} #1</b>, <b>...#2</b></div>
          </Field>
        </div>
      )}

      <button className="ab" onClick={go} disabled={!ok} style={{ ...S.btnPrimary, marginTop: 16, opacity: ok ? 1 : .35 }}>Go to items →</button>
    </div>
  );
}

// ── Item List ────────────────────────────────────────────────────────────────
function ItemList({ t, items, edit, goAdd }) {
  const total = items.reduce((s, i) => s + Number(i.price || 0), 0);
  const avg = items.length ? (total / items.length).toFixed(2) : "0";

  if (!items.length) {
    return (
      <div style={S.center}>
        <div style={{ fontSize: 40, marginBottom: 16, opacity: .3 }}>📦</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>No items yet</div>
        <div style={{ ...S.sub, marginBottom: 24 }}>{t.brand} · {t.category}</div>
        <button className="ab" onClick={goAdd} style={{ ...S.btnPrimary, flex: "none", padding: "13px 32px" }}>+ Add first item</button>
      </div>
    );
  }

  return (
    <div style={S.fill}>
      <div style={S.statsRow}>
        <StatBox label="Items" value={items.length} />
        <StatBox label="Avg" value={`CHF ${avg}`} color="#818cf8" />
        <StatBox label="Total" value={`CHF ${total.toFixed(2)}`} color="#16a34a" />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 18px" }}>
        {items.map((it, i) => (
          <div key={it.id} style={S.card}>
            <div style={S.rowNum}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.rowName}>{it.name}</div>
              <div style={{ display: "flex", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
                {it.size && <Pill>{it.size}</Pill>}
                {it.color && <ColorLabel color={it.color} />}
                {it.hasPhoto && <Pill c="#16a34a">📸</Pill>}
              </div>
            </div>
            <span style={S.rowPrice}>{it.price > 0 ? `CHF ${it.price.toFixed(2)}` : "—"}</span>
            <button className="ch" onClick={() => edit(it.id)} style={S.editBtn}>Edit</button>
          </div>
        ))}
      </div>

      <div style={S.footer}>
        <button className="ab" onClick={goAdd} style={S.btnPrimary}>+ Add item</button>
      </div>
    </div>
  );
}

// ── Add Item (rapid pill-rail flow) ──────────────────────────────────────────
function AddItem({ t, items, onAdd, onDone }) {
  const autoVal = t.autoName ? `${t.autoNamePrefix || t.category || "Item"} #${items.length + 1}` : "";
  const [name, setName] = useState(autoVal);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState(0);
  const [photo, setPhoto] = useState(false);
  const [flash, setFlash] = useState(false);
  const [active, setActive] = useState(t.autoName ? "size" : "name");
  const [addedCount, setAddedCount] = useState(0);
  const ref = useRef(null);

  const resetForm = () => {
    setSize(""); setColor(""); setPrice(0); setPhoto(false);
    setActive(t.autoName ? "size" : "name");
    if (!t.autoName) setName("");
  };

  // Update auto-name when addedCount changes
  useEffect(() => {
    if (t.autoName) setName(`${t.autoNamePrefix || t.category || "Item"} #${items.length + 1}`);
  }, [items.length, t.autoName, t.autoNamePrefix, t.category]);

  const buildItem = () => ({ name: name.trim(), size, color, price, hasPhoto: t.photosOn && photo, brand: t.brand, category: t.category });

  const addAndGoToList = () => {
    if (!name.trim()) return;
    onAdd(buildItem());
    onDone();
  };

  const addAndContinue = () => {
    if (!name.trim()) return;
    onAdd(buildItem());
    setAddedCount(c => c + 1);
    resetForm();
  };

  const fields = [
    { key: "name",  label: "Name",  done: !!name.trim(), val: name.length > 12 ? name.slice(0,10)+"…" : name },
    { key: "size",  label: "Size",  done: !!size,  val: size },
    { key: "color", label: "Color", done: !!color, val: color, hex: COLOR_MAP[color] },
    { key: "price", label: "Price", done: price > 0, val: price > 0 ? price.toFixed(2) : null },
    ...(t.photosOn ? [{ key: "photo", label: "📸", done: photo, val: photo ? "✓" : null }] : []),
  ];

  const advance = (from) => {
    const idx = fields.findIndex(f => f.key === from);
    const next = fields.slice(idx + 1).find(f => !f.done);
    setActive(next ? next.key : "done");
  };

  const tapPill = (f) => {
    if (f.done && f.key === "name" && !t.autoName) setName("");
    else if (f.done && f.key === "size") setSize("");
    else if (f.done && f.key === "color") setColor("");
    else if (f.done && f.key === "price") setPrice(0);
    else if (f.done && f.key === "photo") setPhoto(false);
    setActive(f.key);
  };

  return (
    <div style={S.fill}>
      {flash && <div style={S.flash} />}

      {/* Pill rail */}
      <div style={S.pillRail}>
        {fields.map(f => (
          <PillButton key={f.key} field={f} active={active === f.key} onTap={() => tapPill(f)} />
        ))}
      </div>

      {/* Active field */}
      <div style={S.fieldArea}>
        {active === "name" && (
          <FieldPanel title="Item name">
            <input ref={ref} type="text" value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && name.trim() && advance("name")}
              placeholder="e.g. Floral Midi, Slim Fit..." style={S.nameInput} autoFocus />
            <div style={{ flex: 1 }} />
            {name.trim() && <button className="ab" onClick={() => advance("name")} style={S.continueBtn}>Continue →</button>}
          </FieldPanel>
        )}

        {active === "size" && (
          <FieldPanel title="Size">
            <SizePicker value={size} onPick={s => { setSize(s); advance("size"); }} fullBleed />
          </FieldPanel>
        )}

        {active === "color" && (
          <FieldPanel title="Color">
            <ColorPicker value={color} onPick={c => { setColor(c); advance("color"); }} fullBleed />
          </FieldPanel>
        )}

        {active === "price" && (
          <FieldPanel title="Price" action={<CustomPriceBtn price={price} onSet={p => { setPrice(p); advance("price"); }} />}>
            <PricePicker value={price} onPick={p => { setPrice(p); advance("price"); }} fullBleed />
            {price > 0 && <PriceStepper price={price} onSet={setPrice} />}
          </FieldPanel>
        )}

        {active === "photo" && (
          <FieldPanel>
            <div style={S.center}>
              <button className="ab" onClick={() => { setFlash(true); setTimeout(() => setFlash(false), 130); setTimeout(() => { setPhoto(true); advance("photo"); }, 200); }} style={S.bigPhoto}>
                <span style={{ fontSize: 40 }}>📸</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#888", marginTop: 8 }}>Tap to capture</span>
              </button>
            </div>
          </FieldPanel>
        )}

        {active === "done" && (
          <FieldPanel title="Review">
            <div style={S.previewCard}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{name}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {size && <Pill bg="#f5f5f5" c="#444">{size}</Pill>}
                {color && <ColorLabel color={color} />}
                {t.photosOn && photo && <Pill bg="#ecfdf5" c="#16a34a">📸</Pill>}
              </div>
              {price > 0 && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 20, fontWeight: 700 }}>CHF {price.toFixed(2)}</div>}
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ab" onClick={addAndGoToList} disabled={!name.trim()}
                style={{ ...S.btnPrimary, opacity: name.trim() ? 1 : .35 }}>
                Add & finish
              </button>
              <button className="ab" onClick={addAndContinue} disabled={!name.trim()}
                style={{ ...S.addItemBtn, flex: 2, opacity: name.trim() ? 1 : .35 }}>
                Add & next →
              </button>
            </div>
          </FieldPanel>
        )}
      </div>
    </div>
  );
}

// ── Edit Item ────────────────────────────────────────────────────────────────
function EditItem({ item, onSave, onDelete }) {
  const [name, setName] = useState(item.name);
  const [size, setSize] = useState(item.size || "");
  const [color, setColor] = useState(item.color || "");
  const [price, setPrice] = useState(item.price || 0);

  return (
    <div style={S.scroll}>
      <Field label="Name"><input type="text" value={name} onChange={e => setName(e.target.value)} style={S.input} /></Field>
      <Field label="Size"><SizePicker value={size} onPick={s => setSize(s === size ? "" : s)} /></Field>
      <Field label="Color"><ColorPicker value={color} onPick={c => setColor(c === color ? "" : c)} /></Field>
      <Field label="Price">
        <PriceStepper price={price} onSet={setPrice} />
        <div style={{ marginTop: 8 }}>
          <PricePicker value={price} onPick={setPrice} />
          <CustomPriceBtn price={price} onSet={setPrice} inline />
        </div>
      </Field>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button className="ab" onClick={onDelete} style={S.btnDel}>Delete</button>
        <button className="ab" onClick={() => onSave({ name: name.trim(), size, color, price, hasPhoto: item.hasPhoto })}
          disabled={!name.trim()} style={{ ...S.btnPrimary, opacity: name.trim() ? 1 : .35 }}>Save</button>
      </div>
    </div>
  );
}

// ── Done ─────────────────────────────────────────────────────────────────────
function Done({ t, items, total, reset }) {
  return (
    <div style={S.center}>
      <div className="pop" style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, color: "#16a34a" }}>✓</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{items.length} Published</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, color: "#16a34a", marginBottom: 4 }}>CHF {total.toFixed(2)}</div>
        <div style={S.sub}>{t.brand} · {t.category}</div>
        <button className="ab" onClick={reset} style={{ ...S.btnPrimary, marginTop: 24, flex: "none", width: 180 }}>New batch</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Shared Pickers ───────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

function SizePicker({ value, onPick, fullBleed }) {
  const style = fullBleed ? S.gridFull : S.chipWrap;
  const btn = fullBleed ? S.gridBtn : S.miniChip;
  return (
    <div style={style}>
      {SIZES.map(s => (
        <button key={s} className="ch" onClick={() => onPick(s)} style={{
          ...btn, background: value === s ? "#111" : "#f5f5f5", color: value === s ? "#fff" : "#444",
          border: `1px solid ${value === s ? "#111" : "#eee"}`,
        }}>{s}</button>
      ))}
    </div>
  );
}

function ColorPicker({ value, onPick, fullBleed }) {
  const style = fullBleed ? S.colorGridFull : S.chipWrap;
  return (
    <div style={style}>
      {COLORS.map(c => (
        <button key={c.name} className="ch" onClick={() => onPick(c.name)} style={{
          ...S.colorCell,
          borderColor: value === c.name ? "#111" : "#eee",
          background: value === c.name ? "#f0f0f0" : "#fafafa",
        }}>
          <div style={{ width: fullBleed ? 40 : 28, height: fullBleed ? 40 : 28, borderRadius: fullBleed ? 10 : 7, background: c.hex, border: "1.5px solid #ddd" }} />
          <span style={{ fontSize: fullBleed ? 11 : 9, color: value === c.name ? "#111" : "#555", fontWeight: value === c.name ? 700 : 500, marginTop: 3 }}>{c.name}</span>
        </button>
      ))}
    </div>
  );
}

function PricePicker({ value, onPick, fullBleed }) {
  const style = fullBleed ? S.priceGridFull : S.chipWrap;
  const btn = fullBleed ? S.priceBtnBig : S.priceChipSmall;
  return (
    <div style={style}>
      {PRICES.map(p => (
        <button key={p} className="ch" onClick={() => onPick(p)} style={{
          ...btn, background: value === p ? "#111" : "#f5f5f5", color: value === p ? "#fff" : "#333",
          border: `1px solid ${value === p ? "#111" : "#eee"}`,
        }}>{p.toFixed(2)}</button>
      ))}
    </div>
  );
}

function PriceStepper({ price, onSet }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
      <button className="ch" onClick={() => onSet(Math.max(0, price - 5))} style={S.tweak}>−5</button>
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, minWidth: 70, textAlign: "center" }}>
        {price > 0 ? price.toFixed(2) : "—"}
      </span>
      <button className="ch" onClick={() => onSet(price + 5)} style={S.tweak}>+5</button>
    </div>
  );
}

function CustomPriceBtn({ price, onSet, inline }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");

  const nk = (k) => {
    if (k === "⌫") setVal(v => v.slice(0, -1));
    else if (k === ".") { if (!val.includes(".")) setVal(v => v + "."); }
    else if (k === "✓") { if (val) onSet(Number(val)); setOpen(false); setVal(""); }
    else if (val.length < 6) setVal(v => v + k);
  };

  const openPad = () => { setVal(price > 0 ? String(price) : ""); setOpen(true); };

  return (
    <>
      <button className="ch" onClick={openPad} style={inline ? S.customInline : S.customBtn}>Custom ✎</button>
      {open && <Numpad val={val} nk={nk} close={() => { setOpen(false); setVal(""); }} />}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Shared UI Components ─────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

function Numpad({ val, nk, close }) {
  return (
    <div style={S.overlay} onClick={close}>
      <div style={S.sheet} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#999" }}>Enter price</span>
          <button className="ch" onClick={close} style={S.closeBtn}>×</button>
        </div>
        <div style={S.npDisp}>
          <span style={{ color: "#aaa", fontFamily: "'DM Mono',monospace", fontSize: 14 }}>CHF</span>
          <span style={{ fontSize: 40, fontWeight: 800, color: val ? "#111" : "#ccc", minWidth: 80, textAlign: "right" }}>{val || "0.00"}</span>
        </div>
        <div style={S.npGrid}>
          {["1","2","3","4","5","6","7","8","9",".","0","✓"].map(k => (
            <button key={k} className="ab" onClick={() => nk(k)} style={{
              ...S.npKey, background: k === "✓" ? "#111" : "#f8f8f8",
              color: k === "✓" ? "#fff" : k === "." ? "#888" : "#111",
              border: k === "✓" ? "none" : "1px solid #eee",
              fontSize: k === "✓" ? 18 : k === "." ? 28 : 22,
            }}>{k}</button>
          ))}
        </div>
        <button className="ab" onClick={() => nk("⌫")} style={S.npBack}>⌫ Delete</button>
      </div>
    </div>
  );
}

function Field({ label, req, children }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
        <span style={S.fLabel}>{label}</span>
        {req && <span style={{ fontSize: 7, color: "#ef4444" }}>●</span>}
      </div>
      {children}
    </div>
  );
}

function FieldPanel({ title, action, children }) {
  return (
    <div className="fi" style={S.fieldFull}>
      {(title || action) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          {title && <div style={S.fieldHead}>{title}</div>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function PillButton({ field: f, active, onTap }) {
  return (
    <button className="ch" onClick={onTap} style={{
      ...S.pill,
      background: f.done ? "#ecfdf5" : active ? "#fff" : "#f5f5f5",
      border: `1.5px solid ${f.done ? "#86efac" : active ? "#111" : "#eee"}`,
      color: f.done ? "#16a34a" : active ? "#111" : "#bbb",
      fontWeight: f.done || active ? 600 : 400,
      boxShadow: active && !f.done ? "0 1px 4px rgba(0,0,0,.08)" : "none",
    }}>
      {f.hex && f.done && <span style={{ width: 8, height: 8, borderRadius: 2, background: f.hex, border: "1px solid #ccc", flexShrink: 0 }} />}
      <span style={{ fontSize: 10 }}>{f.done && f.val ? f.val : f.label}</span>
    </button>
  );
}

function Toggle({ label, sub, on, toggle }) {
  return (
    <div style={S.toggleRow}>
      <div><span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span><div style={S.sub}>{sub}</div></div>
      <button className="ch" onClick={toggle} style={{ ...S.tog, background: on ? "#16a34a" : "#ddd", justifyContent: on ? "flex-end" : "flex-start" }}><div style={S.togK} /></button>
    </div>
  );
}

function Chips({ items, value, onPick }) {
  return (
    <div style={S.chipWrap}>
      {items.map(v => (<button key={v} className="ch" onClick={() => onPick(v)} style={{ ...S.chip, background: value === v ? "#111" : "#f5f5f5", color: value === v ? "#fff" : "#666", fontWeight: value === v ? 600 : 400 }}>{v}</button>))}
    </div>
  );
}

function Pill({ bg = "#f0f0f0", c = "#888", children }) {
  return (<span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", background: bg, color: c, padding: "2px 7px", borderRadius: 4, fontWeight: 500 }}>{children}</span>);
}

function ColorLabel({ color }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#888" }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: COLOR_MAP[color], border: "1px solid #ddd" }} />{color}
    </span>
  );
}

function StatBox({ label, value, color = "#111" }) {
  return (
    <div style={S.statBox}>
      <div style={S.sub}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color, marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  ::-webkit-scrollbar{width:3px;height:3px;}
  ::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px;}
  input::placeholder{color:#ccc;}
  input[type=number]{-moz-appearance:textfield;}
  input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pop{0%{transform:scale(.95);opacity:0}70%{transform:scale(1.01)}100%{transform:scale(1);opacity:1}}
  @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  .ch,.ab{transition:all .12s;cursor:pointer;user-select:none;}
  .ch:hover{filter:brightness(.97);}
  .ab:active{transform:scale(.98);}
  .pop{animation:pop .2s ease forwards;}
  .fi{animation:fadeUp .2s ease forwards;}
`;

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  // Layout
  root: { background: "#fff", minHeight: "100vh", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", fontFamily: "'DM Sans',sans-serif", color: "#111" },
  body: { flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", minHeight: 0 },
  scroll: { flex: 1, padding: "16px 18px", overflowY: "auto" },
  fill: { flex: 1, display: "flex", flexDirection: "column", minHeight: 0 },
  center: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 },
  footer: { padding: "12px 18px 16px", borderTop: "1px solid #f0f0f0" },

  // Nav bar
  appBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid #f0f0f0", minHeight: 44 },
  barSide: { flex: 1, display: "flex" },
  barTitle: { fontSize: 15, fontWeight: 700, textAlign: "center" },
  barBack: { background: "none", border: "none", color: "#888", fontSize: 13, fontWeight: 500, padding: 0 },
  barFwd: { background: "#111", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 8 },

  // Typography
  sub: { fontSize: 11, color: "#aaa", marginTop: 1 },
  fLabel: { fontSize: 11, fontWeight: 600, color: "#999", letterSpacing: .3, textTransform: "uppercase" },

  // Inputs
  input: { width: "100%", padding: "10px 12px", background: "#fafafa", border: "1px solid #eee", borderRadius: 8, color: "#111", fontFamily: "'DM Mono',monospace", fontSize: 14, outline: "none" },
  nameInput: { width: "100%", padding: "14px 16px", background: "#fafafa", border: "1px solid #eee", borderRadius: 10, color: "#111", fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 500, outline: "none" },

  // Chips & pills
  chipWrap: { display: "flex", flexWrap: "wrap", gap: 5 },
  chip: { fontSize: 11, fontFamily: "'DM Sans',sans-serif", padding: "5px 10px", borderRadius: 6, cursor: "pointer", userSelect: "none", transition: "all .15s" },
  miniChip: { fontSize: 10, fontFamily: "'DM Mono',monospace", padding: "4px 7px", borderRadius: 5, cursor: "pointer", minWidth: 28, textAlign: "center" },
  pill: { display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0, transition: "all .15s" },
  pillRail: { display: "flex", gap: 6, alignItems: "center", padding: "10px 18px", borderBottom: "1px solid #f0f0f0", overflowX: "auto" },

  // Toggle
  toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8, padding: "12px 14px", marginBottom: 4 },
  tog: { width: 44, height: 24, borderRadius: 12, border: "none", display: "flex", alignItems: "center", padding: 2, transition: "all .2s" },
  togK: { width: 20, height: 20, borderRadius: 10, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.15)" },

  // List
  statsRow: { display: "flex", gap: 8, padding: "10px 18px 6px" },
  statBox: { flex: 1, background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8, padding: "8px 10px" },
  card: { display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", marginBottom: 6, background: "#fff", border: "1px solid #eee", borderRadius: 10 },
  rowNum: { width: 24, height: 24, borderRadius: 6, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#999", flexShrink: 0 },
  rowName: { fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  rowPrice: { fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 500, flexShrink: 0 },
  editBtn: { padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#f5f5f5", border: "1px solid #eee", color: "#888", flexShrink: 0 },

  // Full-bleed field grids (Add Item)
  fieldArea: { flex: 1, display: "flex", flexDirection: "column", minHeight: 0 },
  fieldFull: { flex: 1, display: "flex", flexDirection: "column", padding: "16px 18px" },
  fieldHead: { fontSize: 15, fontWeight: 700 },
  gridFull: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, flex: 1, alignContent: "center" },
  gridBtn: { padding: "16px 8px", borderRadius: 10, fontSize: 15, fontWeight: 600, textAlign: "center", fontFamily: "'DM Mono',monospace" },
  colorGridFull: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, flex: 1, alignContent: "center" },
  colorCell: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 4px", borderRadius: 10, border: "1px solid #eee", cursor: "pointer" },
  priceGridFull: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, flex: 1, alignContent: "center" },
  priceBtnBig: { padding: "16px 8px", borderRadius: 10, fontSize: 15, fontWeight: 600, textAlign: "center", fontFamily: "'DM Mono',monospace" },
  priceChipSmall: { padding: "5px 9px", borderRadius: 6, fontSize: 11, fontFamily: "'DM Mono',monospace", cursor: "pointer" },

  // Price
  tweak: { width: 44, height: 36, borderRadius: 8, background: "#f5f5f5", border: "1px solid #eee", color: "#888", fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center" },
  customBtn: { fontSize: 11, fontWeight: 600, color: "#4f46e5", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 6, padding: "5px 12px" },
  customInline: { padding: "5px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe", cursor: "pointer", marginTop: 4 },

  // Buttons
  btnPrimary: { flex: 1, width: "100%", padding: "13px", background: "#111", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13, textAlign: "center" },
  btnDel: { flex: 1, padding: "13px", background: "#fff", border: "1px solid #fecaca", borderRadius: 8, color: "#ef4444", fontWeight: 600, fontSize: 13, textAlign: "center" },
  continueBtn: { width: "100%", padding: "13px", background: "#111", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13, textAlign: "center", marginBottom: 8 },
  addItemBtn: { width: "100%", padding: "16px", background: "#16a34a", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 15, textAlign: "center" },
  addStrip: { display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderTop: "1px solid #eee", background: "#fafafa" },
  addStripInfo: { flex: 1, minWidth: 0 },
  addStripBtn: { padding: "10px 20px", background: "#16a34a", border: "none", borderRadius: 8, color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0 },

  // Misc
  flash: { position: "fixed", inset: 0, background: "#000", zIndex: 999, opacity: .1 },
  bigPhoto: { width: 160, height: 160, borderRadius: 20, background: "#fafafa", border: "2px dashed #ddd", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  previewCard: { width: "100%", padding: "18px", background: "#fafafa", border: "1px solid #eee", borderRadius: 14 },

  // Numpad
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.2)", zIndex: 200, display: "flex", alignItems: "flex-end" },
  sheet: { width: "100%", maxWidth: 430, margin: "0 auto", background: "#fff", borderRadius: "16px 16px 0 0", padding: "16px 20px 30px", animation: "slideUp .2s ease", boxShadow: "0 -4px 30px rgba(0,0,0,.08)" },
  npDisp: { display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 8, padding: "8px 0 14px", borderBottom: "1px solid #eee", marginBottom: 12 },
  npGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 },
  npKey: { padding: "14px", borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontWeight: 700 },
  npBack: { width: "100%", marginTop: 8, padding: "11px", background: "#f5f5f5", border: "1px solid #eee", borderRadius: 8, color: "#888", fontSize: 13, fontWeight: 600, textAlign: "center" },
  closeBtn: { background: "none", border: "none", fontSize: 18, color: "#bbb" },
};
