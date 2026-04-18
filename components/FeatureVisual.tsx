import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, LayoutDashboard, History, FolderRoot, CheckSquare, Settings, Bell, ChevronRight, Play, Square, Plus, MoreHorizontal } from 'lucide-react';
import { siteConfig } from '@/lib/config';
import { Logo } from './Logo';

export default function FeatureVisual({ activeFeature }: { activeFeature: number }) {
  const feature = siteConfig.features[activeFeature];

  return (
    <div className="absolute inset-0 w-full h-full bg-[#f8fafc] flex overflow-hidden">
      {/* Mini Sidebar */}
      <div className="w-16 md:w-48 bg-white border-r border-border flex flex-col p-4 shrink-0">
         <div className="flex items-center gap-3 mb-10 px-2 lg:px-4">
            <Logo iconOnly className="w-8 h-8 md:w-10 md:h-10 shrink-0" />
            <div className="hidden md:block">
               <h3 className="text-xs font-bold text-ink">Worklog</h3>
               <p className="text-[8px] uppercase tracking-widest text-slate font-bold">Studio</p>
            </div>
         </div>
         
         <div className="space-y-1">
            {[
              { icon: LayoutDashboard, label: 'Dashboard' },
              { icon: History, label: 'History', active: true },
              { icon: FolderRoot, label: 'Projects' },
              { icon: CheckSquare, label: 'Tasks' },
              { icon: Settings, label: 'Settings' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-2 lg:px-4 lg:py-3 rounded-lg cursor-pointer transition-colors ${item.active ? 'bg-accent/5 text-accent' : 'text-slate hover:bg-subtle hover:text-ink'}`}>
                 <item.icon className="w-5 h-5 shrink-0" />
                 <span className="hidden md:block text-xs font-bold">{item.label}</span>
              </div>
            ))}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
         {/* Top Header */}
         <div className="h-16 bg-white border-b border-border flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3 bg-subtle border border-border rounded-lg px-4 py-2 w-full max-w-md">
               <div className="text-[10px] uppercase tracking-widest text-slate font-bold">Project</div>
               <div className="font-bold text-xs text-ink">Study AI</div>
               <div className="w-px h-3 bg-border mx-2"></div>
               <div className="text-[10px] uppercase tracking-widest text-slate font-bold">Task</div>
               <div className="font-bold text-xs text-ink truncate">Take a GAP test</div>
            </div>
            <div className="flex items-center gap-4 ml-4 shrink-0">
               <div className="text-xl font-mono font-bold text-ink hidden sm:block">00:01:10</div>
               <button className="bg-stop text-white px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <Square className="w-3 h-3 fill-current" /> Stop
               </button>
            </div>
         </div>

         {/* Content View with Switcher */}
         <div className="flex-1 p-8 overflow-hidden relative">
            <AnimatePresence mode="wait">
               <motion.div
                 key={activeFeature}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                 className="flex h-full gap-8"
               >
                 {activeFeature === 0 && (
                   <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between mb-8">
                         <h2 className="text-2xl font-black text-ink">Time History</h2>
                         <button className="bg-accent text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-accent/20">
                            <Plus className="w-4 h-4" /> New Entry
                         </button>
                      </div>
                      
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white border border-border rounded-xl p-6 flex items-center justify-between group hover:shadow-md transition-shadow">
                           <div className="flex items-center gap-6">
                              <div className="w-1 h-12 bg-accent rounded-full"></div>
                              <div>
                                 <h4 className="font-bold text-ink">Worklog Landing Page</h4>
                                 <p className="text-xs text-slate mt-1">AI Studio • 07:22 PM - Now</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="font-mono font-bold text-ink">00:45:12</div>
                              <p className="text-[10px] uppercase tracking-widest text-slate mt-1 font-bold">Running</p>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}

                 {activeFeature === 1 && (
                   <div className="flex-1 flex flex-col">
                      <h2 className="text-2xl font-black text-ink mb-8">Focus Analytics</h2>
                      <div className="flex-1 bg-white border border-border rounded-2xl p-8 relative flex flex-col">
                        <div className="flex justify-between items-end gap-2 h-40">
                           {[40, 60, 45, 90, 65, 80, 50, 70, 85, 40].map((h, i) => (
                             <motion.div 
                               key={i}
                               initial={{ height: 0 }}
                               animate={{ height: `${h}%` }}
                               transition={{ delay: i * 0.05, duration: 0.5 }}
                               className="flex-1 bg-accent/20 rounded-t-md relative group"
                             >
                                <div className="absolute inset-0 bg-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-center rounded-t-md"></div>
                             </motion.div>
                           ))}
                        </div>
                        <div className="mt-8 grid grid-cols-3 gap-6">
                           {[
                             { label: 'Flow Score', value: '98%' },
                             { label: 'Deep Work', value: '6.5h' },
                             { label: 'Efficiency', value: '+12%' },
                           ].map((stat, i) => (
                             <div key={i} className="bg-subtle rounded-xl p-4 border border-border/50">
                                <p className="text-[9px] uppercase tracking-[0.2em] text-slate font-black mb-1">{stat.label}</p>
                                <p className="text-xl font-black text-ink">{stat.value}</p>
                             </div>
                           ))}
                        </div>
                      </div>
                   </div>
                 )}

                 {activeFeature === 2 && (
                   <div className="flex-1 flex flex-col">
                      <h2 className="text-2xl font-black text-ink mb-8">Integration Sync</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { name: 'GitHub', desc: 'Sync commits and PRs', active: true },
                          { name: 'Linear', desc: 'Link issues to tasks', active: true },
                          { name: 'Google Calendar', desc: 'Import work events', active: false },
                          { name: 'Notion', desc: 'Sync worklog summaries', active: false },
                        ].map((app, i) => (
                          <div key={i} className="bg-white border border-border rounded-2xl p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-xl ${app.active ? 'bg-accent' : 'bg-slate/20'}`}>
                                  {app.name[0]}
                               </div>
                               <div>
                                  <h4 className="font-bold text-ink">{app.name}</h4>
                                  <p className="text-xs text-slate">{app.desc}</p>
                               </div>
                            </div>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${app.active ? 'bg-accent' : 'bg-slate/20'}`}>
                               <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${app.active ? 'right-1' : 'left-1'}`}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>
                 )}
               </motion.div>
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
}

