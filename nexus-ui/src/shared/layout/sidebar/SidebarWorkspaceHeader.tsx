export function SidebarWorkspaceHeader() {
  return (
    <div className="px-4 py-4 border-b border-slate-200 dark:border-outline-var/10">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md bg-brand-gradient flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">N</span>
        </div>

        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          Nexus System
        </p>
      </div>
    </div>
  );
}
