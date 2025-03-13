// eslint-disable-next-line import/no-unassigned-import
import "webext-base-css";
import "./action_popup.css";
import { saveAs } from "file-saver";
import { formatDate } from "ical-generator";

chrome.tabs.query({ highlighted: true }).then((tabs) => {
  const fragment = new DocumentFragment();

  tabs.forEach((tab) => {
    const tabEl = document.createElement("div");
    tabEl.innerText = tab.title ?? "None";
    const urlEl = document.createElement("small");
    urlEl.innerText = tab.url ?? "None";
    tabEl.appendChild(urlEl);
    fragment.appendChild(tabEl);
  })

  document.querySelector("#tabs-list")?.appendChild(fragment);

  const tabsCountEl = document.querySelector("#tabs-count");

  if (tabsCountEl) {
    tabsCountEl.innerHTML = String(tabs.length);
  }

  const formEl = document.querySelector("form");

  formEl?.addEventListener("submit", () => {
    const formData = formEl ? new FormData(formEl) : undefined;

    const todos = !formData?.get("individual") ? [
      "BEGIN:VTODO",
      `UID:${crypto.randomUUID()}`,
      `DTSTAMP:${formatDate(null, new Date())}`,
      `SUMMARY:${formData?.get("summary")?.toString() || tabs.map(tab => tab.title).join(", ") || "New task"}`,
      `DESCRIPTION:${tabs.map(tab => `${tab.title}:\\n\n ${tab.url}`).join("\\n\n \\n\n ")}`,
      "STATUS:NEEDS-ACTION",
      "END:VTODO",
    ] : tabs.map(tab => [
      "BEGIN:VTODO",
      `UID:${crypto.randomUUID()}`,
      `DTSTAMP:${formatDate(null, new Date())}`,
      `SUMMARY:${tab.title}`,
      `DESCRIPTION:${tab.url}`,
      "STATUS:NEEDS-ACTION",
      "END:VTODO",
    ]).flat();

    const fileText = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID://tjbp/tab2icalendar//NONSGML v1.0//EN",
      ...todos,
      "END:VCALENDAR",
    ].join("\n");

    saveAs(new Blob([fileText], {type: "text/icalendar;charset=utf-8"}), `tab2icalendar-${String(new Date().getTime())}.ics`);
  });
});
