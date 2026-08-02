import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { BottomNav } from "./components/Chrome";
import Login from "./screens/Login";
import InventoryScreen from "./screens/InventoryScreen";
import AddItemScreen from "./screens/AddItemScreen";
import ItemDetailScreen from "./screens/ItemDetailScreen";
import BuyersScreen from "./screens/BuyersScreen";
import BuyerDetailScreen from "./screens/BuyerDetailScreen";
import SettingsScreen from "./screens/SettingsScreen";
import MetricsScreen from "./screens/MetricsScreen";
import AccountsScreen from "./screens/AccountsScreen";
import AccountDetailScreen from "./screens/AccountDetailScreen";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = not checked yet
  const [tab, setTab] = useState("inventory");
  const [view, setView] = useState("list"); // list | add | detail | settings
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [categories, setCategories] = useState([]);
  const [sites, setSites] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadCategories();
      loadSites();
      loadAccounts();
    }
  }, [session]);

  async function loadCategories() {
    const { data } = await supabase.from("categories").select("*").order("label");
    setCategories(data || []);
  }

  async function loadSites() {
    const { data } = await supabase.from("sites").select("*").order("name");
    setSites(data || []);
  }

  async function loadAccounts() {
    const { data } = await supabase.from("accounts").select("*").order("name");
    setAccounts(data || []);
  }

  function resetToList() {
    setView("list");
    setSelectedItem(null);
    setSelectedBuyer(null);
    setRefreshKey((k) => k + 1);
  }

  if (session === undefined) {
    return <div className="min-h-screen bg-[#5C4033]" />;
  }

  if (!session) {
    return <Login />;
  }

  let screen;
  if (view === "add") {
    screen = (
      <AddItemScreen
        categories={categories}
        refreshCategories={loadCategories}
        sites={sites}
        refreshSites={loadSites}
        accounts={accounts}
        refreshAccounts={loadAccounts}
        onDone={resetToList}
        onBack={() => setView("list")}
      />
    );
  } else if (view === "settings") {
    screen = (
      <SettingsScreen
        categories={categories}
        refreshCategories={loadCategories}
        sites={sites}
        refreshSites={loadSites}
        onBack={() => setView("list")}
      />
    );
  } else if (selectedItem) {
    screen = (
      <ItemDetailScreen
        item={selectedItem}
        categories={categories}
        onBack={() => setSelectedItem(null)}
        onChanged={() => setRefreshKey((k) => k + 1)}
      />
    );
  } else if (selectedBuyer) {
    screen = (
      <BuyerDetailScreen
        buyer={selectedBuyer}
        onBack={() => setSelectedBuyer(null)}
        onChanged={() => setRefreshKey((k) => k + 1)}
      />
    );
  } else if (selectedAccount) {
    screen = (
      <AccountDetailScreen
        account={selectedAccount}
        onBack={() => setSelectedAccount(null)}
        onChanged={() => {
          setRefreshKey((k) => k + 1);
          loadAccounts();
        }}
      />
    );
  } else if (tab === "inventory") {
    screen = (
      <InventoryScreen
        key={refreshKey}
        categories={categories}
        onSelectItem={setSelectedItem}
        onAddItem={() => setView("add")}
        onOpenSettings={() => setView("settings")}
      />
    );
  } else if (tab === "buyers") {
    screen = <BuyersScreen key={refreshKey} onSelectBuyer={setSelectedBuyer} />;
  } else if (tab === "accounts") {
    screen = <AccountsScreen key={refreshKey} onSelectAccount={setSelectedAccount} refreshAccounts={loadAccounts} />;
  } else {
    screen = <MetricsScreen key={refreshKey} />;
  }

  const showNav = view === "list" && !selectedItem && !selectedBuyer && !selectedAccount;

  return (
    <div className="min-h-screen flex justify-center bg-[#5C4033] font-body">
      <div className="w-full max-w-sm landscape:max-w-2xl min-h-screen relative bg-paper">
        {screen}
        {showNav && <BottomNav tab={tab} setTab={setTab} />}
      </div>
    </div>
  );
}
