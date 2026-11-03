"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCheck,
  Download,
  Filter,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import styles from "./BoardGuestTable.module.css";
import type { GuestItem } from "./GuestDrawer";

export interface BoardGuestTableProps {
  guests: GuestItem[];
  onToggleCheckIn: (guest: GuestItem) => void;
  onRemoveGuest: (guest: GuestItem) => void;
  onAddGuestClick: () => void;
  onShareGuest: (guest: GuestItem) => void;
  onExportCsv: () => void;
  onSelectGuestForDrawer: (guest: GuestItem) => void;
  onBulkCheckIn?: (selectedGuests: GuestItem[]) => void;
  onBulkWhatsApp?: (selectedGuests: GuestItem[]) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function BoardGuestTable({
  guests,
  onToggleCheckIn,
  onRemoveGuest,
  onAddGuestClick,
  onShareGuest,
  onExportCsv,
  onSelectGuestForDrawer,
  onBulkCheckIn,
  onBulkWhatsApp,
  refreshing = false,
  onRefresh,
}: BoardGuestTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [groupFilter, setGroupFilter] = useState<string>("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Distinct groups for dropdown
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    for (const g of guests) {
      if (g.group) set.add(g.group);
    }
    return Array.from(set);
  }, [guests]);

  // Counts by status
  const counts = useMemo(() => {
    return {
      all: guests.length,
      confirmed: guests.filter((g) => g.status === "Confirmed").length,
      pending: guests.filter((g) => g.status === "Pending").length,
      maybe: guests.filter((g) => g.status === "Maybe").length,
      declined: guests.filter((g) => g.status === "Declined").length,
    };
  }, [guests]);

  // Filtered list
  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      // Status filter
      if (statusFilter !== "All" && guest.status !== statusFilter) {
        return false;
      }
      // Group filter
      if (groupFilter !== "All" && guest.group !== groupFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = guest.name.toLowerCase().includes(query);
        const matchesPhone = guest.phone.toLowerCase().includes(query);
        const matchesGroup = (guest.group || "").toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesGroup) {
          return false;
        }
      }
      return true;
    });
  }, [guests, statusFilter, groupFilter, searchQuery]);

  // Selection handlers
  const allFilteredSelected =
    filteredGuests.length > 0 &&
    filteredGuests.every((g) => selectedIds.has(g.phone));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set<string>();
      for (const g of filteredGuests) {
        next.add(g.phone);
      }
      setSelectedIds(next);
    }
  }

  function toggleRow(phone: string) {
    const next = new Set(selectedIds);
    if (next.has(phone)) {
      next.delete(phone);
    } else {
      next.add(phone);
    }
    setSelectedIds(next);
  }

  const selectedList = useMemo(() => {
    return guests.filter((g) => selectedIds.has(g.phone));
  }, [guests, selectedIds]);

  function handleBulkCheckIn() {
    if (onBulkCheckIn && selectedList.length > 0) {
      onBulkCheckIn(selectedList);
      setSelectedIds(new Set());
    }
  }

  function handleBulkWhatsApp() {
    if (onBulkWhatsApp && selectedList.length > 0) {
      onBulkWhatsApp(selectedList);
    }
  }

  return (
    <section className={styles.tableCard} id="guests" aria-label="Guest Management Table">
      {/* Table Header Top */}
      <div className={styles.tableHeaderTop}>
        <div className={styles.headerTitleBox}>
          <h2>Guest Command Center</h2>
          <span style={{ fontSize: "12px", color: "#8c8376" }}>
            Manage attendance, door check-ins, and individual invitations
          </span>
        </div>

        <div className={styles.headerActions}>
          {onRefresh && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onRefresh}
              disabled={refreshing}
              title="Refresh live guest RSVPs"
            >
              <RefreshCw size={13} style={refreshing ? { animation: "spin 1s linear infinite" } : undefined} />
              <span>{refreshing ? "Updating..." : "Refresh"}</span>
            </button>
          )}

          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={onExportCsv}
            title="Download CSV spreadsheet"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onAddGuestClick}
          >
            <Plus size={14} />
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className={styles.filterControlsBar}>
        {/* Search Input */}
        <div className={styles.searchBox}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, phone, or group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className={styles.statusTabs}>
          {[
            { id: "All", label: "All", count: counts.all },
            { id: "Confirmed", label: "Confirmed", count: counts.confirmed },
            { id: "Pending", label: "Pending", count: counts.pending },
            { id: "Maybe", label: "Maybe", count: counts.maybe },
            { id: "Declined", label: "Declined", count: counts.declined },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${statusFilter === tab.id ? styles.tabActive : ""}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              <span>{tab.label}</span>
              <span className={styles.tabCount}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Group Filter Select */}
        {availableGroups.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={13} style={{ color: "#8c8376" }} />
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              style={{
                fontSize: "11px",
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1px solid #ddd6cc",
                background: "#ffffff",
                color: "#201e1b",
                cursor: "pointer",
              }}
            >
              <option value="All">All Groups</option>
              {availableGroups.map((grp) => (
                <option key={grp} value={grp}>
                  {grp}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className={styles.bulkBar}>
          <div className={styles.bulkLeft}>
            <span className={styles.bulkBadge}>{selectedIds.size} selected</span>
            <span>Bulk actions for selected guests</span>
          </div>
          <div className={styles.bulkActions}>
            {onBulkCheckIn && (
              <button
                type="button"
                className={styles.bulkActionBtn}
                onClick={handleBulkCheckIn}
              >
                <CheckCheck size={13} /> Mark All Checked In
              </button>
            )}
            {onBulkWhatsApp && (
              <button
                type="button"
                className={styles.bulkActionBtn}
                onClick={handleBulkWhatsApp}
              >
                <MessageCircle size={13} /> Send WhatsApp to Selected
              </button>
            )}
            <button
              type="button"
              className={styles.bulkActionBtn}
              onClick={() => setSelectedIds(new Set())}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className={styles.tableContainer}>
        {filteredGuests.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Users size={22} />
            </div>
            <h3>No guests found</h3>
            <p>
              {searchQuery || statusFilter !== "All" || groupFilter !== "All"
                ? "No guests match your current filter criteria. Try adjusting or clearing your filters."
                : "Your guest list is currently empty. Add guests or share your link to get started!"}
            </p>
            {(searchQuery || statusFilter !== "All" || groupFilter !== "All") && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All");
                  setGroupFilter("All");
                }}
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxTh}>
                  <input
                    type="checkbox"
                    className={styles.customCheckbox}
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all guests"
                  />
                </th>
                <th>Guest &amp; Group</th>
                <th>Seats</th>
                <th>Status</th>
                <th>Door Check-in</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => {
                const isSelected = selectedIds.has(guest.phone);
                const isRsvpRow = guest.phone.startsWith("rsvp:");

                return (
                  <tr
                    key={`${guest.name}-${guest.phone}`}
                    style={isSelected ? { background: "#faf8f5" } : undefined}
                  >
                    {/* Checkbox */}
                    <td className={styles.checkboxTd}>
                      <input
                        type="checkbox"
                        className={styles.customCheckbox}
                        checked={isSelected}
                        onChange={() => toggleRow(guest.phone)}
                        aria-label={`Select ${guest.name}`}
                      />
                    </td>

                    {/* Guest Cell */}
                    <td>
                      <div
                        className={styles.guestCell}
                        onClick={() => onSelectGuestForDrawer(guest)}
                      >
                        <div className={styles.avatar}>
                          {guest.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className={styles.guestInfo}>
                          <strong>{guest.name}</strong>
                          <small>
                            {guest.group || "Guest"} ·{" "}
                            {isRsvpRow ? "Online RSVP" : guest.phone}
                          </small>
                        </div>
                      </div>
                    </td>

                    {/* Seats badge */}
                    <td>
                      <span className={styles.seatsBadge}>
                        <Users size={12} />
                        {guest.guests}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          guest.status === "Confirmed"
                            ? styles.statusConfirmed
                            : guest.status === "Declined"
                            ? styles.statusDeclined
                            : guest.status === "Maybe"
                            ? styles.statusMaybe
                            : styles.statusPending
                        }`}
                      >
                        {guest.status === "Confirmed" && <Check size={11} />}
                        {guest.status}
                      </span>
                    </td>

                    {/* Door Check-In */}
                    <td>
                      <button
                        type="button"
                        className={`${styles.doorBtn} ${guest.checkedIn ? styles.doorBtnActive : ""}`}
                        onClick={() => onToggleCheckIn(guest)}
                        title="Toggle venue check-in"
                      >
                        {guest.checkedIn ? (
                          <>
                            <Check size={12} /> Checked In
                          </>
                        ) : (
                          "Check In"
                        )}
                      </button>
                    </td>

                    {/* Row Actions */}
                    <td>
                      <div className={styles.rowActions} style={{ justifyContent: "flex-end" }}>
                        {!isRsvpRow && (
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnWa}`}
                            onClick={() => onShareGuest(guest)}
                            title={`Send WhatsApp to ${guest.name}`}
                          >
                            <MessageCircle size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.iconBtnDelete}`}
                          onClick={() => onRemoveGuest(guest)}
                          title={`Delete ${guest.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

