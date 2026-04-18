import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, LayoutDashboard, History, FolderRoot, CheckSquare, Settings, Bell, ChevronRight, Play, Square, Plus, MoreHorizontal } from 'lucide-react';
import { siteConfig } from '@/lib/config';
import { Logo } from './Logo';

export default function FeatureVisual({ activeFeature }: { activeFeature: number }) {
  const feature = siteConfig.features[activeFeature];

  return (
    <div className="absolute inset-0 w-full h-full bg-[#f8fafc] flex overflow-hidden">
      {/* Mini Sidebar */}
      <div className="hidden lg:flex lg:w-56 bg-white border-r border-border flex-col p-4 shrink-0 transition-all duration-300">
         <div className="flex items-center gap-3 mb-10 px-2">
            <Logo iconOnly className="w-8 h-8 shrink-0" />
            <div className="hidden lg:block">
               <h3 className="text-xs font-bold text-ink">Worklog</h3>
               <p className="text-[8px] uppercase tracking-widest text-slate font-bold">Studio</p>
            </div>
         </div>
         
         <div className="space-y-1">
            {[
              { icon: LayoutDashboard, label: 'Dashboard', active: activeFeature === 1 },
              { icon: History, label: 'History', active: activeFeature === 0 },
              { icon: FolderRoot, label: 'Projects' },
              { icon: CheckSquare, label: 'Tasks' },
              { icon: Settings, label: 'Settings', active: activeFeature === 2 },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-2 lg:px-4 lg:py-3 rounded-lg cursor-pointer transition-colors ${item.active ? 'bg-accent/5 text-accent' : 'text-slate hover:bg-subtle hover:text-ink'}`}>
                 <item.icon className="w-5 h-5 shrink-0" />
                 <span className="hidden lg:block text-xs font-bold">{item.label}</span>
              </div>
            ))}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
         {/* Top Header */}
         <div className="h-16 sm:h-20 bg-white border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 gap-4">
            <div className="flex flex-1 items-center gap-4 sm:gap-8 overflow-hidden">
               <div className="flex flex-col min-w-0">
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-slate font-black mb-0.5">Project</span>
                  <div className="font-bold text-[10px] sm:text-xs text-ink truncate">Study AI</div>
               </div>
               <div className="w-px h-6 bg-border shrink-0"></div>
               <div className="flex flex-col min-w-0">
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-slate font-black mb-0.5">Task</span>
                  <div className="font-bold text-[10px] sm:text-xs text-ink truncate">Take a GAP test</div>
               </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
               <div className="text-base sm:text-xl font-mono font-bold text-ink whitespace-nowrap">00:01:10</div>
               <button className="bg-stop text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group transition-all hover:bg-stop/90 shadow-lg shadow-stop/10">
                  <Square className="w-2.5 h-2.5 sm:w-3 h-3 fill-current" /> 
                  <span className="hidden sm:inline">Stop</span>
               </button>
            </div>
         </div>

         {/* Content View with Switcher */}
         <div className="flex-1 p-4 sm:p-6 lg:p-10 overflow-hidden relative bg-[#f8fafc]">
            <AnimatePresence mode="wait">
               <motion.div
                 key={activeFeature}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                 className="w-full h-full"
               >
                 {activeFeature === 0 && (
                   <div className="w-full space-y-4 max-w-2xl mx-auto">
                      <div className="flex items-center justify-between mb-8">
                         <h2 className="text-xl sm:text-2xl font-black text-ink">Time History</h2>
                         <button className="bg-accent text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl shadow-accent/20 transition-all hover:translate-y-[-2px]">
                            <Plus className="w-4 h-4" /> New Entry
                         </button>
                      </div>
                      
                      {[
                        { title: 'Take a GAP test', project: 'Study AI', duration: '00:01:10', status: 'Running', time: '07:22 PM - Now' },
                        { title: 'Landing page polish', project: 'Marketing', duration: '02:15:22', status: 'Finished', time: '12:45 PM - 03:00 PM' },
                        { title: 'Fix timer bug', project: 'Core Engine', duration: '00:45:12', status: 'Finished', time: '09:00 AM - 09:45 AM' },
                      ].map((item, i) => (
                        <div key={i} className={`bg-white border ${item.status === 'Running' ? 'border-accent/30 shadow-lg shadow-accent/5 ring-1 ring-accent/5' : 'border-border'} rounded-2xl p-4 sm:p-5 flex items-center justify-between group transition-all hover:border-accent/40`}>
                           <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                              <div className={`w-1 h-10 sm:h-12 rounded-full shrink-0 ${item.status === 'Running' ? 'bg-accent animate-pulse' : 'bg-slate/20'}`}></div>
                              <div className="min-w-0">
                                 <h4 className="font-bold text-ink text-sm sm:text-base truncate">{item.title}</h4>
                                 <p className="text-[10px] sm:text-xs text-slate mt-1 flex items-center gap-2">
                                    <span className="font-bold text-accent/80">{item.project}</span>
                                    <span className="opacity-30">•</span>
                                    <span>{item.time}</span>
                                 </p>
                              </div>
                           </div>
                           <div className="text-right shrink-0 ml-4">
                              <div className={`font-mono font-bold text-sm sm:text-lg ${item.status === 'Running' ? 'text-accent' : 'text-ink'}`}>{item.duration}</div>
                              <p className={`text-[9px] uppercase tracking-[0.2em] mt-1 font-black ${item.status === 'Running' ? 'text-accent' : 'text-slate/60'}`}>
                                 {item.status}
                              </p>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}

                 {activeFeature === 1 && (
                   <div className="w-full flex flex-col max-w-2xl mx-auto">
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
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                           {[
                             { label: 'Flow Score', value: '98%' },
                             { label: 'Deep Work', value: '6.5h' },
                             { label: 'Efficiency', value: '+12%' },
                           ].map((stat, i) => (
                             <div key={i} className="bg-subtle rounded-xl p-4 border border-border/50 flex flex-col justify-center min-h-[80px]">
                                <p className="text-[9px] uppercase tracking-[0.2em] text-slate font-black mb-1 leading-tight break-words">{stat.label}</p>
                                <p className="text-xl font-black text-ink leading-none">{stat.value}</p>
                             </div>
                           ))}
                        </div>
                      </div>
                   </div>
                 )}

                 {activeFeature === 2 && (
                   <div className="w-full flex flex-col max-w-2xl mx-auto">
                      <h2 className="text-2xl font-black text-ink mb-8">Integration Sync</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {[
                          { name: 'GitHub', desc: 'Sync commits and pull requests', active: true },
                          { name: 'Linear', desc: 'Link issues to your workspace', active: true },
                          { name: 'Google Calendar', desc: 'Import your work events automatically', active: false },
                          { name: 'Notion', desc: 'Sync summaries and project logs', active: false },
                        ].map((app, i) => (
                          <div key={i} className="bg-white border border-border rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-4 transition-all hover:border-accent/30 group">
                            <div className="flex flex-col gap-1 text-left min-w-0">
                               <h4 className="font-black text-ink text-sm sm:text-base leading-tight">{app.name}</h4>
                               <p className="text-[11px] sm:text-xs text-slate leading-relaxed font-medium">{app.desc}</p>
                            </div>
                            <div className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${app.active ? 'bg-accent' : 'bg-slate/20'}`}>
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

