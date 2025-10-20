export function setupTabs(container, args) {
    const tabsTopEl = container.querySelector('#tabs-top');
    const tabsBottomEl = container.querySelector('#tabs-bottom');
    const tabButtons = [
        ...Array.from(tabsTopEl.querySelectorAll('.tab')),
        ...Array.from(tabsBottomEl.querySelectorAll('.tab'))
    ];
    const viewTimer = container.querySelector('#view-timer');
    const viewTemplates = container.querySelector('#view-templates');
    const viewSettings = container.querySelector('#view-settings');
    const animateBars = () => {
        tabsTopEl.classList.add('tabs-switch');
        tabsBottomEl.classList.add('tabs-switch');
        window.setTimeout(() => { tabsTopEl.classList.remove('tabs-switch'); tabsBottomEl.classList.remove('tabs-switch'); }, 240);
    };
    const switchTo = (page) => {
        viewTimer.style.display = page === 'timer' ? '' : 'none';
        viewTemplates.style.display = page === 'templates' ? '' : 'none';
        viewSettings.style.display = page === 'settings' ? '' : 'none';
        tabButtons.forEach((b) => b.classList.toggle('active', b.dataset.page === page));
        args.panel.classList.toggle('view', page === 'settings');
        if (page !== 'settings')
            args.panel.classList.remove('show');
        const view = page === 'timer' ? viewTimer : page === 'templates' ? viewTemplates : viewSettings;
        view.classList.add('fade-in');
        window.setTimeout(() => view.classList.remove('fade-in'), 300);
        const next = { ...args.current(), activeTab: page };
        void args.save(next);
        animateBars();
    };
    tabButtons.forEach((b) => { b.onclick = () => switchTo(b.dataset.page ?? 'timer'); });
    const selTabsPlacement = container.querySelector('#tabs-placement');
    const applyTabsPlacement = () => {
        const preferBottom = (args.current().tabsPlacement ?? 'top') === 'bottom';
        const autoSmall = window.innerWidth < 540;
        const useBottom = preferBottom || autoSmall;
        tabsTopEl.style.display = useBottom ? 'none' : '';
        tabsBottomEl.style.display = useBottom ? '' : 'none';
    };
    selTabsPlacement.onchange = async () => {
        const next = { ...args.current(), tabsPlacement: selTabsPlacement.value };
        await args.save(next);
        applyTabsPlacement();
    };
    return { switchTo, applyTabsPlacement };
}
