import React, { useState, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { PlaceholdersAndVanishInput } from "./ui/placeholders-and-vanish-input";

interface SearchBarProps {
  variant: "hero" | "page";
}

export const SearchBar: React.FC<SearchBarProps> = ({ variant }) => {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const queryFromUrl = (search as any)?.q || "";
  const [query, setQuery] = useState(queryFromUrl);

  const placeholders = [
    "Search by ThingDaddy ID...",
    "Enter MAC Address...",
    "Scan or type RFID/URN...",
    "Search by assigned user...",
  ];

  useEffect(() => {
    setQuery(queryFromUrl);
  }, [queryFromUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      // Short delay to allow the vanish particles to be visible before navigation unmounts
      setTimeout(() => {
        navigate({ to: '/search', search: { q: query.trim() } as any });
      }, 400);
    }
  };

  return (
    <motion.div
      layoutId="search-bar"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "relative w-full max-w-7xl mx-auto",
        variant === "hero" ? "px-4" : "px-0"
      )}
    >
      <PlaceholdersAndVanishInput
        placeholders={placeholders}
        onChange={handleChange}
        onSubmit={handleSubmit}
        defaultValue={variant === "page" ? queryFromUrl : ""}
      />
    </motion.div>
  );
};

