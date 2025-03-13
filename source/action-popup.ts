// eslint-disable-next-line import/no-unassigned-import
import 'webext-base-css';
import {saveAs} from 'file-saver';
import {formatDate} from 'ical-generator';
import './action-popup.css';

chrome.tabs.query({highlighted: true}).then(tabs => {
	const fragment = new DocumentFragment();

	for (const tab of tabs) {
		const tabElement = document.createElement('div');
		tabElement.textContent = tab.title ?? 'None';
		const urlElement = document.createElement('small');
		urlElement.textContent = tab.url ?? 'None';
		tabElement.append(urlElement);
		fragment.append(tabElement);
	}

	document.querySelector('#tabs-list')?.append(fragment);

	const tabsCountElement = document.querySelector('#tabs-count');

	if (tabsCountElement) {
		tabsCountElement.textContent = String(tabs.length);
	}

	const formElement = document.querySelector('form');

	formElement?.addEventListener('submit', () => {
		const formData = formElement ? new FormData(formElement) : undefined;

		const todos = formData?.get('individual') ? tabs.flatMap(tab => [
			'BEGIN:VTODO',
			`UID:${crypto.randomUUID()}`,
			`DTSTAMP:${formatDate(null, new Date())}`,
			`SUMMARY:${tab.title}`,
			`DESCRIPTION:${tab.url}`,
			'STATUS:NEEDS-ACTION',
			'END:VTODO',
		]) : [
			'BEGIN:VTODO',
			`UID:${crypto.randomUUID()}`,
			`DTSTAMP:${formatDate(null, new Date())}`,
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			`SUMMARY:${formData?.get('summary')?.toString() || tabs.map(tab => tab.title).join(', ') || 'New task'}`,
			`DESCRIPTION:${tabs.map(tab => `${tab.title}:\\n\n ${tab.url}`).join('\\n\n \\n\n ')}`,
			'STATUS:NEEDS-ACTION',
			'END:VTODO',
		];

		const fileText = [
			'BEGIN:VCALENDAR',
			'VERSION:2.0',
			'PRODID://tjbp/tab2icalendar//NONSGML v1.0//EN',
			...todos,
			'END:VCALENDAR',
		].join('\n');

		saveAs(new Blob([fileText], {type: 'text/icalendar;charset=utf-8'}), `tab2icalendar-${String(Date.now())}.ics`);
	});
}).catch((error: unknown) => {
	throw error;
});
