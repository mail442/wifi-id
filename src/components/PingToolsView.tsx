import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  ChevronLeft, 
  Menu, 
  X,
  Info, 
  Eye, 
  Network, 
  Activity, 
  Globe, 
  GitCommit, 
  Gauge, 
  Zap, 
  Shield, 
  Cpu, 
  Waves, 
  Wifi, 
  Search, 
  Sliders, 
  HelpCircle, 
  Terminal, 
  Play, 
  Square, 
  RefreshCw, 
  Send, 
  CheckCircle, 
  AlertTriangle,
  Monitor,
  Database,
  Smartphone,
  Tv,
  ExternalLink,
  Volume2,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PingToolsViewProps {
  onBack: () => void;
  onNavigateToGangguan: () => void;
}

// Host preset types
interface HostPreset {
  id: string;
  name: string;
  host: string;
  category: "Local" | "DNS" | "Game" | "Medsos";
  baseLatency: number;
}

const HOST_PRESETS: HostPreset[] = [
  { id: "gateway", name: "Gateway Lokal (RT Net)", host: "192.168.1.1", category: "Local", baseLatency: 2 },
  { id: "cloudflare", name: "Cloudflare CDN", host: "1.1.1.1", category: "DNS", baseLatency: 12 },
  { id: "google", name: "Google Public DNS", host: "8.8.8.8", category: "DNS", baseLatency: 18 },
  { id: "mlbb", name: "Mobile Legends Asia", host: "sg.mobilelegends.com", category: "Game", baseLatency: 28 },
  { id: "facebook", name: "Facebook Meta Edge", host: "edge.facebook.com", category: "Medsos", baseLatency: 35 },
];

// Tools menu items matching the design screenshot
interface ToolMenuItem {
  id: string;
  name: string;
  icon: React.ElementType;
}

const TOOLS_MENU_ITEMS: ToolMenuItem[] = [
  { id: "info", name: "Info", icon: Info },
  { id: "watcher", name: "Watcher", icon: Eye },
  { id: "lan", name: "Local-Area Network", icon: Network },
  { id: "ping", name: "Ping", icon: Activity },
  { id: "geoping", name: "GeoPing", icon: Globe },
  { id: "traceroute", name: "Traceroute", icon: GitCommit },
  { id: "iperf", name: "iPerf", icon: Gauge },
  { id: "speedtest", name: "SpeedTest", icon: Zap },
  { id: "port_scanner", name: "Pemindai port", icon: Shield },
  { id: "upnp_scanner", name: "Pemindai UPnP", icon: Cpu },
  { id: "bonjour", name: "Bonjour browser", icon: Waves },
  { id: "wifi_scanner", name: "Pemindai Wi-Fi", icon: Wifi },
  { id: "whois", name: "Whois", icon: Search },
  { id: "dns_lookup", name: "DNS Lookup", icon: Sliders },
];

interface PingLog {
  seq: number;
  host: string;
  bytes: number;
  ttl: number;
  time: number;
  status: "SUCCESS" | "TIMEOUT" | "ERROR";
  timestamp: string;
}

export const PingToolsView: React.FC<PingToolsViewProps> = ({
  onBack,
  onNavigateToGangguan
}) => {
  const [activeTool, setActiveTool] = useState<string>("ping");
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true); // Open initially to let user enjoy the side menu

  // Helper Refs
  const terminalWrapperRef = useRef<HTMLDivElement | null>(null);

  // States - Ping
  const [selectedHostId, setSelectedHostId] = useState<string>("gateway");
  const [isPingRunning, setIsPingRunning] = useState<boolean>(false);
  const [pingSpeed, setPingSpeed] = useState<number>(1000);
  const [pingLogs, setPingLogs] = useState<PingLog[]>([]);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // States - WAN / LAN Scanner
  const [isScanningLan, setIsScanningLan] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scannedDevices, setScannedDevices] = useState<Array<{ ip: string; mac: string; vendor: string; name: string; type: "router" | "phone" | "tv" | "laptop" | "device"; active: boolean }>>([]);

  // States - Traceroute
  const [traceHost, setTraceHost] = useState<string>("8.8.8.8");
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [traceHops, setTraceHops] = useState<Array<{ hop: number; ip: string; latency: string; name: string }>>([]);

  // States - Port Scanner
  const [portHost, setPortHost] = useState<string>("192.168.1.1");
  const [isScanningPorts, setIsScanningPorts] = useState<boolean>(false);
  const [scannedPorts, setScannedPorts] = useState<Array<{ port: number; service: string; status: "OPEN" | "CLOSED"; responseTime: number }>>([]);

  // States - DNS Lookup
  const [dnsHost, setDnsHost] = useState<string>("google.com");
  const [isResolvingDns, setIsResolvingDns] = useState<boolean>(false);
  const [dnsRecords, setDnsRecords] = useState<Array<{ type: string; value: string; ttl: number; priority?: number }>>([]);

  // States - Whois
  const [whoisHost, setWhoisHost] = useState<string>("rtnet.id");
  const [isQueryingWhois, setIsQueryingWhois] = useState<boolean>(false);
  const [whoisResult, setWhoisResult] = useState<string>("");

  // States - Watcher (continuous ping of multiple target nodes)
  const [isWatcherRunning, setIsWatcherRunning] = useState<boolean>(false);
  const [watcherStats, setWatcherStats] = useState<Record<string, Array<{ time: number; status: "UP" | "DOWN" }>>>({
    "Gateway Lokal": [],
    "Google Server": [],
    "Cloudflare CDN": [],
  });
  const watcherIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // States - SpeedTest Interactive
  const [speedStage, setSpeedStage] = useState<"idle" | "connecting" | "ping" | "download" | "upload" | "finished">("idle");
  const [speedPing, setSpeedPing] = useState<number>(0);
  const [speedJitter, setSpeedJitter] = useState<number>(0);
  const [speedDownload, setSpeedDownload] = useState<number>(0);
  const [speedUpload, setSpeedUpload] = useState<number>(0);
  const [currentGaugeValue, setCurrentGaugeValue] = useState<number>(0);
  const [testProgress, setTestProgress] = useState<number>(0);
  const [speedHistory, setSpeedHistory] = useState<Array<{ date: string; download: number; upload: number; ping: number }>>([
    { date: "19/06 09:12", download: 45.4, upload: 18.2, ping: 12 },
    { date: "18/06 20:34", download: 47.9, upload: 19.5, ping: 10 },
  ]);

  // States - iPerf Interactive
  const [iperfStage, setIperfStage] = useState<"idle" | "connecting" | "running" | "finished">("idle");
  const [iperfBandwidth, setIperfBandwidth] = useState<number>(0);
  const [iperfLoss, setIperfLoss] = useState<number>(0);
  const [iperfJitter, setIperfJitter] = useState<number>(0);
  const [iperfLogs, setIperfLogs] = useState<string[]>([]);

  const speedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const iperfIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll terminal log internally container
  useEffect(() => {
    if (terminalWrapperRef.current) {
      terminalWrapperRef.current.scrollTop = terminalWrapperRef.current.scrollHeight;
    }
  }, [pingLogs]);

  // Clean interval hooks
  useEffect(() => {
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);
      if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
      if (iperfIntervalRef.current) clearInterval(iperfIntervalRef.current);
    };
  }, []);

  // Cleanup on active tool changes
  useEffect(() => {
    stopSpeedTest();
    stopIperfTest();
    stopPing();
  }, [activeTool]);

  const startSpeedTest = () => {
    setSpeedStage("connecting");
    setTestProgress(0);
    setCurrentGaugeValue(0);
    setSpeedPing(0);
    setSpeedJitter(0);
    setSpeedDownload(0);
    setSpeedUpload(0);

    if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);
    if (iperfIntervalRef.current) clearInterval(iperfIntervalRef.current);

    let progress = 0;
    let elapsedMs = 0;
    
    speedIntervalRef.current = setInterval(() => {
      elapsedMs += 100;
      
      if (elapsedMs <= 1500) {
        progress = Math.round((elapsedMs / 1500) * 15);
        setTestProgress(progress);
        setCurrentGaugeValue(0);
      } else if (elapsedMs <= 3000) {
        if (progress < 15) progress = 15;
        const pingProgress = Math.round(((elapsedMs - 1500) / 1500) * 15) + 15;
        setTestProgress(pingProgress);
        setSpeedStage("ping");
        
        setCurrentGaugeValue(Math.round(Math.random() * 5 + 8)); 
        
        if (elapsedMs >= 3000) {
          setSpeedPing(Math.round(Math.random() * 6 + 9));
          setSpeedJitter(Math.round(Math.random() * 2 + 1));
        }
      } else if (elapsedMs <= 7000) {
        setSpeedStage("download");
        const dlProgress = Math.round(((elapsedMs - 3000) / 4000) * 35) + 30;
        setTestProgress(dlProgress);
        
        const ratio = (elapsedMs - 3000) / 4000;
        let targetSpeed = 0;
        if (ratio < 0.3) {
          targetSpeed = 15 + ratio * 3 * 30;
        } else {
          targetSpeed = 48.2 + (Math.sin(elapsedMs / 150) * 2.8) + (Math.random() - 0.5) * 1.5;
        }
        
        const currentDL = parseFloat(targetSpeed.toFixed(1));
        setCurrentGaugeValue(currentDL);
        setSpeedDownload(currentDL);
      } else if (elapsedMs <= 11000) {
        setSpeedStage("upload");
        const ulProgress = Math.round(((elapsedMs - 7000) / 4000) * 35) + 65;
        setTestProgress(ulProgress);
        
        const ratio = (elapsedMs - 7000) / 4000;
        let targetSpeed = 0;
        if (ratio < 0.25) {
          targetSpeed = 5 + ratio * 4 * 12;
        } else {
          targetSpeed = 18.5 + (Math.sin(elapsedMs / 200) * 1.2) + (Math.random() - 0.5) * 0.8;
        }
        
        const currentUL = parseFloat(targetSpeed.toFixed(1));
        setCurrentGaugeValue(currentUL);
        setSpeedUpload(currentUL);
      } else {
        clearInterval(speedIntervalRef.current!);
        speedIntervalRef.current = null;
        
        setSpeedStage("finished");
        setTestProgress(100);
        setCurrentGaugeValue(0);
        
        setSpeedHistory(prev => [
          {
            date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" }) + " " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            download: speedDownload || 48.2,
            upload: speedUpload || 18.5,
            ping: speedPing || 12
          },
          ...prev.slice(0, 4)
        ]);
      }
    }, 100);
  };

  const stopSpeedTest = () => {
    setSpeedStage("idle");
    setCurrentGaugeValue(0);
    setTestProgress(0);
    if (speedIntervalRef.current) {
      clearInterval(speedIntervalRef.current);
      speedIntervalRef.current = null;
    }
  };

  const startIperfTest = () => {
    setIperfStage("connecting");
    setIperfLogs([
      "Connecting to iPerf3 server ip: 103.189.96.68 on port 5201...",
      "Establishing server control channel...",
      "Performing cookie exchange...",
      "Local address: 192.168.1.100 port 49542",
      "Remote address: 103.189.96.68 port 5201"
    ]);
    setIperfBandwidth(0);
    setIperfLoss(0);
    setIperfJitter(0);

    if (iperfIntervalRef.current) clearInterval(iperfIntervalRef.current);
    if (speedIntervalRef.current) clearInterval(speedIntervalRef.current);

    let logsList = [
      "Connecting to iPerf3 server ip: 103.189.96.68 on port 5201...",
      "Establishing server control channel...",
      "Performing cookie exchange...",
      "Local address: 192.168.1.100 port 49542",
      "Remote address: 103.189.96.68 port 5201",
      "- - - - - - - - - - - - - - - - - - - - - - - - -",
      "[  5] local 192.168.1.100 port 49542 connected to 103.189.96.68 port 5201",
      "[ ID] Interval           Transfer     Bitrate         Retr"
    ];

    setTimeout(() => {
      setIperfStage("running");
      let sec = 1;

      iperfIntervalRef.current = setInterval(() => {
        if (sec <= 5) {
          const trans = (5.5 + Math.random() * 0.6).toFixed(2);
          const speed = (44.0 + Math.random() * 8.0).toFixed(1);
          const retrans = Math.random() < 0.15 ? "1" : "0";
          const logLine = `[  5]  ${(sec - 1).toFixed(2)}-${sec.toFixed(2)}  sec  ${trans} MBytes  ${speed} Mbits/sec  ${retrans}  256 KBytes`;
          
          logsList = [...logsList, logLine];
          setIperfLogs(logsList);
          sec++;
        } else {
          clearInterval(iperfIntervalRef.current!);
          iperfIntervalRef.current = null;

          logsList = [
            ...logsList,
            "- - - - - - - - - - - - - - - - - - - - - - - - -",
            "[ ID] Interval           Transfer     Bitrate         Retr",
            "[  5]  0.00-5.00   sec  28.4 MBytes  47.6 Mbits/sec    1             sender",
            "[  5]  0.00-5.00   sec  28.3 MBytes  47.4 Mbits/sec                  receiver",
            "",
            "iPerf3 test successful (Client -> Server). Connection closed."
          ];
          
          setIperfLogs(logsList);
          setIperfStage("finished");
          setIperfBandwidth(47.4);
          setIperfLoss(0.1);
          setIperfJitter(1.8);
        }
      }, 1000);

    }, 1500);
  };

  const stopIperfTest = () => {
    setIperfStage("idle");
    if (iperfIntervalRef.current) {
      clearInterval(iperfIntervalRef.current);
      iperfIntervalRef.current = null;
    }
  };


  const currentHost = useMemo(() => {
    return HOST_PRESETS.find(h => h.id === selectedHostId) || HOST_PRESETS[0];
  }, [selectedHostId]);

  // Calculate statistics of pingLogs
  const pingStats = useMemo(() => {
    const successLogs = pingLogs.filter(l => l.status === "SUCCESS");
    if (successLogs.length === 0) {
      return { sent: pingLogs.length, received: 0, loss: pingLogs.length > 0 ? 100 : 0, min: 0, max: 0, avg: 0, jitter: 0, statusText: "Offline", statusColor: "text-slate-400" };
    }

    const times = successLogs.map(l => l.time);
    const min = Math.min(...times);
    const max = Math.max(...times);
    const avg = Math.round(times.reduce((sum, val) => sum + val, 0) / times.length);
    const loss = Math.round(((pingLogs.length - successLogs.length) / pingLogs.length) * 100);

    let jitterSum = 0;
    for (let i = 1; i < times.length; i++) {
      jitterSum += Math.abs(times[i] - times[i - 1]);
    }
    const jitter = times.length > 1 ? Math.round(jitterSum / (times.length - 1)) : 0;

    let statusText = "BAGUS (STABIL)";
    let statusColor = "text-emerald-500";

    if (loss > 15 || avg > 100) {
      statusText = "BURUK / RTO / LAG";
      statusColor = "text-rose-500 animate-pulse";
    } else if (loss > 0 || avg > 45 || jitter > 15) {
      statusText = "TIDAK STABIL";
      statusColor = "text-amber-500";
    }

    return { sent: pingLogs.length, received: successLogs.length, loss, min, max, avg, jitter, statusText, statusColor };
  }, [pingLogs]);

  // Execute single ping simulated line
  const executeSinglePing = (sequenceNum: number) => {
    const rand = Math.random();
    let status: "SUCCESS" | "TIMEOUT" | "ERROR" = "SUCCESS";
    let time = 0;

    if (rand < 0.04) {
      status = "TIMEOUT";
    } else if (rand < 0.06) {
      status = "ERROR";
    } else {
      const fluctuation = (Math.random() - 0.5) * (currentHost.baseLatency * 0.35);
      const isSpike = Math.random() < 0.1;
      const spikeVal = isSpike ? Math.random() * 65 + 30 : 0;
      time = Math.round(Math.max(1, currentHost.baseLatency + fluctuation + spikeVal));
    }

    const newLog: PingLog = {
      seq: sequenceNum,
      host: currentHost.host,
      bytes: status === "SUCCESS" ? 64 : 0,
      ttl: status === "SUCCESS" ? (currentHost.id === "gateway" ? 64 : 56) : 0,
      time,
      status,
      timestamp: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    };

    setPingLogs(prev => [...prev.slice(-34), newLog]);
  };

  const startPing = () => {
    if (isPingRunning) return;
    setIsPingRunning(true);
    setPingLogs([]);
    
    let seq = 1;
    executeSinglePing(seq++);

    pingIntervalRef.current = setInterval(() => {
      executeSinglePing(seq++);
    }, pingSpeed);
  };

  const stopPing = () => {
    if (!isPingRunning) return;
    setIsPingRunning(false);
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  // Watcher Simulation Loop
  useEffect(() => {
    if (isWatcherRunning) {
      watcherIntervalRef.current = setInterval(() => {
        setWatcherStats(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(node => {
            const isUp = Math.random() > 0.04;
            let base = 2;
            if (node === "Google Server") base = 18;
            if (node === "Cloudflare CDN") base = 12;

            const variance = (Math.random() - 0.5) * (base * 0.4);
            const isSpike = Math.random() < 0.08;
            const finalTime = isUp ? Math.round(base + variance + (isSpike ? 45 : 0)) : 0;

            updated[node] = [...(updated[node] || []).slice(-15), {
              time: finalTime,
              status: isUp ? "UP" : "DOWN"
            }];
          });
          return updated;
        });
      }, 1200);
    } else {
      if (watcherIntervalRef.current) {
        clearInterval(watcherIntervalRef.current);
        watcherIntervalRef.current = null;
      }
    }
    return () => {
      if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);
    };
  }, [isWatcherRunning]);

  // Action: Simulated LAN Scan 
  const handleStartLanScan = () => {
    if (isScanningLan) return;
    setIsScanningLan(true);
    setScanProgress(0);
    setScannedDevices([]);

    const mockDevices = [
      { ip: "192.168.1.1", mac: "e4:ca:12:ef:90:bc", vendor: "Huawei Technologies", name: "Huawei ONU Gateway", type: "router" as const, active: true },
      { ip: "192.168.1.100", mac: "40:83:de:99:ab:12", vendor: "Xiaomi Communications", name: "Redmi Note 12 - HP Anda", type: "phone" as const, active: true },
      { ip: "192.168.1.101", mac: "24:fc:e5:0c:78:ef", vendor: "Samsung Electronics", name: "Samsung Smart TV", type: "tv" as const, active: true },
      { ip: "192.168.1.104", mac: "bc:e2:65:42:1a:de", vendor: "Intel Corporation", name: "Dell Inspiron Client", type: "laptop" as const, active: true },
      { ip: "192.168.1.109", mac: "a0:21:b7:da:09:eb", vendor: "TP-Link Corporation", name: "Wi-Fi Repeater Extender", type: "device" as const, active: false },
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setScanProgress(currentProgress);

      if (currentProgress % 20 === 0) {
        const itemIndex = (currentProgress / 20) - 1;
        if (mockDevices[itemIndex]) {
          setScannedDevices(prev => [...prev, mockDevices[itemIndex]]);
        }
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsScanningLan(false);
      }
    }, 150);
  };

  // Action: Traceroute Simulation
  const handleStartTraceroute = () => {
    if (isTracing) return;
    setIsTracing(true);
    setTraceHops([]);

    const targets: Record<string, string[]> = {
      "8.8.8.8": ["192.168.1.1", "10.24.0.1", "180.244.11.97", "125.160.10.22", "72.14.215.34", "8.8.8.8"],
      "1.1.1.1": ["192.168.1.1", "10.24.0.1", "141.101.71.5", "108.162.243.21", "172.67.14.15", "1.1.1.1"],
      "sg.mobilelegends.com": ["192.168.1.1", "10.35.12.1", "116.140.231.54", "203.111.109.12", "185.22.45.109", "103.12.9.22"],
    };

    const targetHops = targets[traceHost] || ["192.168.1.1", "10.88.1.1", "202.155.10.45", "103.10.15.5"];
    let step = 0;

    const interval = setInterval(() => {
      if (step < targetHops.length) {
        const ip = targetHops[step];
        let name = "Hop Node Router";
        if (ip.startsWith("192.168")) name = "Model ONU RT-Net Node";
        else if (ip.startsWith("10.")) name = "Local ISP Gateway";
        else if (ip.includes("telkom") || ip.startsWith("180.")) name = "Telkom Backbone Network";
        else name = "CDN Global Anycast Routing";

        const baseLat = (step + 1) * 3;
        const finalLat = `${Math.round(baseLat + Math.random() * 4)}ms`;

        setTraceHops(prev => [
          ...prev, 
          { hop: step + 1, ip, latency: finalLat, name }
        ]);
        step++;
      } else {
        clearInterval(interval);
        setIsTracing(false);
      }
    }, 450);
  };

  // Action: Port Scanner Simulation
  const handleStartPortScan = () => {
    if (isScanningPorts) return;
    setIsScanningPorts(true);
    setScannedPorts([]);

    const portsToScan = [
      { port: 21, service: "FTP" },
      { port: 22, service: "SSH" },
      { port: 23, service: "Telnet" },
      { port: 53, service: "DNS" },
      { port: 80, service: "HTTP" },
      { port: 161, service: "SNMP" },
      { port: 443, service: "HTTPS" },
      { port: 1900, service: "UPnP System" },
      { port: 3306, service: "MySQL DB" },
      { port: 8080, service: "HTTP-Alt" },
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < portsToScan.length) {
        const item = portsToScan[step];
        // Router opens some diagnostic ports, other hosts do not
        const isOpen = portHost.endsWith(".1") 
          ? [22, 53, 80, 1900, 8080].includes(item.port)
          : [80, 443].includes(item.port);

        setScannedPorts(prev => [
          ...prev,
          {
            port: item.port,
            service: item.service,
            status: isOpen ? "OPEN" : "CLOSED",
            responseTime: Math.round(Math.random() * 45 + 5)
          }
        ]);
        step++;
      } else {
        clearInterval(interval);
        setIsScanningPorts(false);
      }
    }, 250);
  };

  // Action: DNS Lookup Simulation
  const handleStartDnsLookup = () => {
    if (isResolvingDns) return;
    setIsResolvingDns(true);
    setDnsRecords([]);

    setTimeout(() => {
      const records = [
        { type: "A (Host IP)", value: dnsHost === "google.com" ? "142.251.10.100" : "103.189.96.68", ttl: 299 },
        { type: "AAAA (IPv6)", value: "2404:6800:4003:c00::64", ttl: 299 },
        { type: "MX (Mail)", value: `10 mail.protection.${dnsHost}`, priority: 10, ttl: 3600 },
        { type: "NS (Nameserver)", value: "ns1.rtnet-nameserver.id", ttl: 86400 },
        { type: "TXT", value: "v=spf1 include:_spf.google.com ~all", ttl: 3600 },
      ];
      setDnsRecords(records);
      setIsResolvingDns(false);
    }, 800);
  };

  // Action: WHOIS Simulation
  const handleStartWhois = () => {
    if (isQueryingWhois) return;
    setIsQueryingWhois(true);
    setWhoisResult("");

    setTimeout(() => {
      const resultString = 
        `Domain Name: ${whoisHost.toUpperCase()}\n` +
        `Registry Domain ID: 22104599_DOMAIN_ID-ID\n` +
        `Registrar WHOIS Server: whois.idnic.id\n` +
        `Updated Date: 2026-03-12T10:11:22Z\n` +
        `Creation Date: 2021-06-19T09:23:09Z\n` +
        `Registry Expiry Date: 2028-06-19T09:23:09Z\n` +
        `Registrar: Pengurus Jasa Internet Terpadu (PJI)\n` +
        `Domain Status: clientTransferProhibited https://idnic.id\n` +
        `Registry Registrant ID: RT_NET_INFRA\n` +
        `Registrant Name: RT Net Fiber Community\n` +
        `Registrant Street: RT 04 RW 05, Blok Makmur\n` +
        `Registrant City: Surabaya\n` +
        `Registrant State/Province: Jawa Timur\n` +
        `Registrant Country: ID\n` +
        `Name Server: NS1.RTNET-NAMESERVER.ID\n` +
        `Name Server: NS2.RTNET-NAMESERVER.ID\n` +
        `>>> Last update of WHOIS database: 2026-06-19T09:47:00Z <<<`;

      setWhoisResult(resultString);
      setIsQueryingWhois(false);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#F5F9FC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 overflow-x-hidden relative">
      
      {/* DRAWER SIDE MENU */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Dark semi-transparent backdrop overlay - no touch blocks */}
            <div 
              className="fixed inset-0 bg-black/40 z-40" 
              onClick={() => setIsDrawerOpen(false)}
            />
            
            {/* Drawer Container */}
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 left-0 w-[270px] bg-[#1a1a1a] dark:bg-slate-900 border-r border-[#2d2d2d] dark:border-slate-800 text-slate-200 z-50 flex flex-col shadow-2xl"
            >
              {/* Drawer Header matching visual layout inside screenshot */}
              <div className="bg-[#2a2a2a] dark:bg-slate-950 p-4 flex items-center justify-between border-b border-[#333333] dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-sky-400 rotate-12" />
                  <span className="font-extrabold text-base tracking-tight font-sans text-white">PingTools</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-400 shrink-0">
                  <button className="hover:text-white p-1 rounded transition" title="Sound alerts">
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <button className="hover:text-white p-1 rounded transition" title="Settings">
                    <Settings className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="hover:text-white p-1 bg-[#3a3a3a] rounded transition shrink-0 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Items List */}
              <div className="flex-1 overflow-y-auto py-2 divide-y divide-[#2a2a2a]/40">
                <div className="px-2 py-1 space-y-1">
                  {TOOLS_MENU_ITEMS.map(item => {
                    const IconComp = item.icon;
                    const isSelected = activeTool === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTool(item.id);
                          setIsDrawerOpen(false);
                        }}
                        className={`w-full py-2.5 px-3 rounded-xl flex items-center space-x-3 text-left text-xs font-semibold cursor-pointer select-none transition-all ${
                          isSelected 
                            ? "bg-[#333] dark:bg-slate-800 text-[#118EEA] dark:text-sky-400 font-extrabold shadow-sm border-l-4 border-[#118EEA]" 
                            : "text-slate-350 hover:text-white hover:bg-[#252525] dark:hover:bg-slate-850"
                        }`}
                      >
                        <IconComp className={`h-4.5 w-4.5 shrink-0 ${isSelected ? "text-[#118EEA] dark:text-sky-400" : "text-slate-450"}`} />
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer Credit */}
              <div className="p-3.5 bg-[#171717] dark:bg-slate-950 border-t border-[#2a2a2a] text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Diagnostics RT Net</span>
                <span className="text-[8px] font-normal text-slate-650 block">v4.8.2-Community Android</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN TOP BAR OF THE ACTIVE SCREEN */}
      <div className="bg-slate-900 text-white pt-12 pb-10 px-6 sticky top-0 z-30 flex items-center justify-between shadow-2xl relative overflow-hidden">
        {/* Background ambient lighting blobs */}
        <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center space-x-4 relative z-10">
          <button onClick={onBack} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 cursor-pointer relative shrink-0 transition"
            title="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <h2 className="text-sm font-black font-sans uppercase tracking-tighter">
              <span>{TOOLS_MENU_ITEMS.find(t => t.id === activeTool)?.name || activeTool}</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
              RT-Net Diagnostics
            </p>
          </div>
        </div>
      </div>

      {/* DASH BOARD CONTAINER PLATFORM */}
      <div className="p-4 space-y-4 max-w-sm mx-auto pb-24">
        
        {/* QUICK DRAWER EXPANSION REMINDER BANNER */}
        <div className="bg-sky-50 dark:bg-sky-955/10 p-3 rounded-2xl border border-sky-100 dark:border-sky-900/60 flex items-center justify-between transition-colors">
          <div className="space-y-0.5">
            <h4 className="text-[10px] font-black text-sky-850 dark:text-sky-300 uppercase tracking-wide">Pindah Alat Alat Diagnostik</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-tight">Tekan tombol menu <Menu className="h-3.5 w-3.5 inline mx-0.5 text-[#118EEA]" /> di pojok kiri atas untuk melihat list lengkap</p>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="bg-[#118EEA] hover:bg-[#008CE7] text-white font-extrabold uppercase text-[9.5px] py-1 px-3.5 rounded-lg shrink-0 cursor-pointer"
          >
            MENU
          </button>
        </div>

        {/* DYNAMIC COMPONENT RENDERER DEPENDING ON activeTool */}
        
        {/* VIEW 1: INFO MODE */}
        {activeTool === "info" && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm space-y-3.5 animate-fadeIn">
            <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <Info className="h-5 w-5 text-[#118EEA]" />
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-850 dark:text-white">Informasi Koneksi Jaringan</h3>
                <p className="text-[9px] text-[#118EEA] font-bold">Detail Perangkat & Sinyal Aktif</p>
              </div>
            </div>

            <div className="flex flex-col space-y-2 divider-y border-slate-100 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-slate-400">Nama Wi-Fi (SSID)</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-150">RT_NET_ULTRA_FAST</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-slate-400">IP Publik Anda</span>
                <span className="font-mono font-extrabold text-[#118EEA] bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded">103.189.96.68</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-slate-400">IP Lokal Router</span>
                <span className="font-mono font-bold">192.168.1.1</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-slate-400">IP HP/Komputer Anda</span>
                <span className="font-mono font-bold">192.168.1.142</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-slate-400">Subnet Mask</span>
                <span className="font-mono">255.255.255.0</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-slate-400">DNS Lokal Server</span>
                <span className="font-mono">8.8.8.8 | 1.1.1.1</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-slate-400">Frekuensi Wi-Fi</span>
                <span className="font-bold text-emerald-500">5.0 GHz (Dual-Band)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-slate-400">Kekuatan Sinyal (dBm)</span>
                <span className="font-bold text-emerald-500 font-mono">-48 dBm (Sangat Kuat)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-slate-400">MAC Address Lokal</span>
                <span className="font-mono text-[11px] text-slate-500">40:83:de:99:ab:12</span>
              </div>
            </div>
          </section>
        )}

        {/* VIEW 2: WATCHER INTERACTIVE */}
        {activeTool === "watcher" && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-[#118EEA]" />
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-850 dark:text-white">Active Node Watcher</h3>
                  <p className="text-[9px] text-[#118EEA] font-bold">Monitoring Real-time Berkelanjutan</p>
                </div>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>

            <div className="space-y-4">
              {Object.keys(watcherStats).map((host, i) => {
                const logs = watcherStats[host] || [];
                const latest = logs[logs.length - 1];
                return (
                  <div key={i} className="space-y-1.5 p-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">{host}</span>
                      <span className={`text-[10px] uppercase font-bold ${latest?.status === "UP" ? "text-emerald-500" : "text-rose-500"}`}>
                        {latest ? `${latest.status} (${latest.time}ms)` : "Menunggu..."}
                      </span>
                    </div>
                    {/* Status grid timeline dots */}
                    <div className="flex gap-1 pt-1.5">
                      {Array.from({ length: 15 }).map((_, dotIdx) => {
                        const logVal = logs[dotIdx];
                        return (
                          <div
                            key={dotIdx}
                            className={`flex-1 h-4.5 rounded-md transition-all ${
                              logVal 
                                ? logVal.status === "UP"
                                  ? logVal.time < 15 ? "bg-emerald-500" : "bg-sky-500"
                                  : "bg-rose-500 animate-ping"
                                : "bg-slate-200 dark:bg-slate-850"
                            }`}
                            title={logVal ? `${logVal.time} ms` : "No data"}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsWatcherRunning(!isWatcherRunning)}
                className={`w-full py-2.5 text-xs text-white rounded-xl font-bold transition flex items-center justify-center space-x-1.5 ${
                  isWatcherRunning ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700 animate-pulse"
                }`}
              >
                {isWatcherRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{isWatcherRunning ? "NONAKTIFKAN WATCHER" : "MULAI AKTIFKAN WATCHER"}</span>
              </button>
            </div>
          </section>
        )}

        {/* VIEW 3: LOCAL AREA NETWORK (LAN) SCANNER */}
        {(activeTool === "lan" || activeTool === "wifi_scanner" || activeTool === "upnp_scanner" || activeTool === "bonjour") && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm space-y-3.5 animate-fadeIn">
            <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <Network className="h-5 w-5 text-indigo-500" />
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-850 dark:text-white">
                  {activeTool === "lan" ? "Pemindai Local-Area Network (LAN)" : activeTool === "wifi_scanner" ? "Pemindai Sinyal Wi-Fi Terdekat" : "Penyelidik UPnP Bonjour"}
                </h3>
                <p className="text-[9px] text-[#118EEA] font-bold">Scanning range IP: 192.168.1.1 - 192.168.1.120</p>
              </div>
            </div>

            {/* SCAN PREPARATION */}
            <div className="space-y-3">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    disabled
                    value="192.168.1.1/24"
                    className="w-full bg-[#F3F6F9] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleStartLanScan}
                  disabled={isScanningLan}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition active:scale-95 disabled:opacity-50"
                >
                  {isScanningLan ? "MEMINDAI..." : "PINDAI LAN"}
                </button>
              </div>

              {/* Progress bar */}
              {isScanningLan && (
                <div className="space-y-1">
                  <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 bottom-0 left-0 bg-indigo-500 transition-all duration-150"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                    <span>Sedang menyelidiki IP klien...</span>
                    <span>{scanProgress}%</span>
                  </div>
                </div>
              )}

              {/* Device List */}
              <div className="space-y-2 divide-y divide-slate-50 dark:divide-slate-800 max-h-[250px] overflow-y-auto pr-1">
                {scannedDevices.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 italic text-xs">
                    Belum ada perangkat terpindai. Tekan "PINDAI LAN" untuk meraba jaringan lokal.
                  </div>
                ) : (
                  scannedDevices.map((dev, idx) => (
                    <div key={idx} className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-850 shrink-0">
                          {dev.type === "router" ? <Monitor className="h-4 w-4 text-[#118EEA]" /> : dev.type === "phone" ? <Smartphone className="h-4 w-4 text-emerald-500" /> : dev.type === "tv" ? <Tv className="h-4 w-4 text-amber-500" /> : <Monitor className="h-4 w-4 text-purple-500" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-snug">{dev.name}</h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono">
                            {dev.ip} &bull; {dev.mac.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[8.5px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400">
                          {dev.vendor.split(" ")[0]}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* VIEW 4: PING MODE */}
        {activeTool === "ping" && (
          <>
            {/* Ping Host Selection Setup Form */}
            <section className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3.5 animate-fadeIn">
              <div className="space-y-1">
                <label className="block text-[8.5px] font-black uppercase text-slate-400 tracking-wider">
                  Tujuan Host Target Pemeriksaan
                </label>
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {HOST_PRESETS.map(h => (
                    <button
                      key={h.id}
                      onClick={() => {
                        setSelectedHostId(h.id);
                        if (isPingRunning) stopPing();
                        setPingLogs([]);
                      }}
                      className={`py-2 px-0.5 text-center rounded-xl text-[9.5px] font-extrabold uppercase border transition-all truncate cursor-pointer ${
                        selectedHostId === h.id 
                          ? "bg-sky-50 dark:bg-sky-955/20 text-[#118EEA] dark:text-sky-400 border-[#118EEA] font-black"
                          : "bg-slate-50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {h.id.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-100">{currentHost.name}</h4>
                  <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Alamat Gateway: {currentHost.host}</p>
                </div>
                <span className="text-[9px] font-black tracking-wider bg-sky-100 dark:bg-sky-900/40 text-[#118EEA] dark:text-sky-400 px-2 py-0.5 rounded-lg uppercase">
                  {currentHost.category}
                </span>
              </div>

              {/* ACTION TOGGLE BUTTONS */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {isPingRunning ? (
                  <button
                    type="button"
                    onClick={stopPing}
                    className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer transition-all"
                  >
                    <Square className="h-4 w-4" />
                    <span>HENTIKAN PING</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startPing}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer transition-all animate-pulse-once"
                  >
                    <Play className="h-4 w-4 animate-pulse" />
                    <span>MULAI PING TEST</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPingLogs([])}
                  disabled={pingLogs.length === 0}
                  className="py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 disabled:opacity-50 disabled:pointer-events-none rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>BERSIHKAN LOG</span>
                </button>
              </div>
            </section>

            {/* LIVE LATENCY HUD METRICS */}
            <section className="grid grid-cols-3 gap-2">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-1">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Min IP ms</span>
                <span className="text-xl font-black font-mono text-[#118EEA] block">
                  {pingStats.min} <span className="text-[10px] text-slate-400 font-bold">ms</span>
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-1">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Loss Rate</span>
                <span className={`text-xl font-black font-mono block ${pingStats.loss > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                  {pingStats.loss}<span className="text-[10px] font-bold">%</span>
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-1">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Avg Delay</span>
                <span className="text-xl font-black font-mono text-purple-500 block">
                  {pingStats.avg} <span className="text-[10px] text-slate-400 font-bold">ms</span>
                </span>
              </div>
            </section>

            {/* GRAPH */}
            {pingLogs.length > 0 && (
              <section className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Trend Stabil Jaringan</span>
                  <span className={`text-[9.5px] font-black uppercase ${pingStats.statusColor}`}>
                    {pingStats.statusText}
                  </span>
                </div>
                <div className="h-12 flex items-end gap-0.5 pt-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl px-2 border border-slate-100 dark:border-slate-850">
                  {pingLogs.slice(-28).map((log, idx) => {
                    const normalizedHeight = Math.min(100, Math.max(9, (log.time / 140) * 100));
                    return (
                      <div 
                        key={idx}
                        className={`flex-1 rounded-t-sm transition-all ${
                          log.status === "SUCCESS"
                            ? log.time < 28 ? "bg-emerald-500" : log.time < 70 ? "bg-amber-400" : "bg-orange-500"
                            : "bg-rose-500 h-full animate-pulse"
                        }`}
                        style={{ height: log.status === "SUCCESS" ? `${normalizedHeight}%` : "100%" }}
                        title={`Time: ${log.time}ms`}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* LIVE TERMINAL WRAPPER */}
            <section className="bg-[#111827] text-slate-300 p-4 rounded-2xl border border-slate-800 shadow-md space-y-1 relative overflow-hidden">
              <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black/40 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-slate-500">
                <Terminal className="h-2.5 w-2.5 text-sky-400" />
                <span>ICMP Shell</span>
              </div>
              <h3 className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 border-b border-slate-800 pb-1.5 mb-2 flex items-center space-x-1">
                <span>TERMINAL INTERACTIVE PING (ICMP_SEC)</span>
              </h3>

              <div 
                ref={terminalWrapperRef}
                className="font-mono text-[9.5px] leading-relaxed max-h-[160px] overflow-y-auto space-y-1 selection:bg-indigo-900/50"
              >
                {pingLogs.length === 0 ? (
                  <div className="text-slate-550 italic py-3 text-center select-none">
                    Terminal siap. Klik "MULAI PING TEST" untuk me-rekam tracer.
                  </div>
                ) : (
                  pingLogs.map((log, index) => (
                    <div key={index} className="flex items-center space-x-1.5">
                      <span className="text-slate-600 select-none">[{log.timestamp}]</span>
                      {log.status === "SUCCESS" ? (
                        <span className="text-emerald-400 font-semibold">
                          64 bytes from {log.host}: icmp_seq={log.seq} ttl={log.ttl} time={log.time} ms
                        </span>
                      ) : (
                        <span className="text-rose-500 font-bold">
                          Request timeout for icmp_seq {log.seq}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {/* VIEW 5: GEOPING (Internet Server Location) */}
        {activeTool === "geoping" && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm space-y-3.5 animate-fadeIn">
            <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <Globe className="h-5 w-5 text-[#118EEA]" />
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-850 dark:text-white">GeoPing Network Checker</h3>
                <p className="text-[9px] text-[#118EEA] font-bold">Pemantau Rute Server Global Multi-Region</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-105 dark:border-slate-850 flex justify-between items-center text-xs">
                <div>
                  <span className="font-black text-slate-800 dark:text-slate-200 block">Singapura Node</span>
                  <span className="text-[10px] text-slate-400 font-bold block">Amazon Web Services (AWS)</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-extrabold text-emerald-500 block">19 ms</span>
                  <span className="text-[9px] bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded font-black uppercase">Stabil</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-105 dark:border-slate-850 flex justify-between items-center text-xs">
                <div>
                  <span className="font-black text-slate-800 dark:text-slate-200 block">Tokyo, Jepang</span>
                  <span className="text-[10px] text-slate-400 font-bold block">Linode Tokyo Center</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-extrabold text-sky-500 block">58 ms</span>
                  <span className="text-[9px] bg-sky-50 dark:bg-sky-900/15 text-sky-600 dark:text-sky-450 px-1 py-0.2 rounded font-black uppercase">Normal</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-105 dark:border-slate-850 flex justify-between items-center text-xs">
                <div>
                  <span className="font-black text-slate-800 dark:text-slate-200 block">California, AS</span>
                  <span className="text-[10px] text-slate-400 font-bold block">Google Datacenter</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-extrabold text-amber-500 block">142 ms</span>
                  <span className="text-[9px] bg-amber-50 dark:bg-amber-900/15 text-amber-600 dark:text-amber-400 px-1 py-0.2 rounded font-black uppercase">Lambat</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* VIEW 6: TRACEROUTE */}
        {activeTool === "traceroute" && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm space-y-3.5 animate-fadeIn">
            <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <GitCommit className="h-5 w-5 text-emerald-500" />
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-850 dark:text-white">Traceroute (Pelacak Rute Paket)</h3>
                <p className="text-[9px] text-emerald-500 font-bold">Menganalisis lintasan hop visual</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex space-x-2">
                <select
                  value={traceHost}
                  onChange={(e) => setTraceHost(e.target.value)}
                  className="flex-1 bg-[#F3F6F9] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="8.8.8.8">Google DNS (8.8.8.8)</option>
                  <option value="1.1.1.1">Cloudflare (1.1.1.1)</option>
                  <option value="sg.mobilelegends.com">MLBB Server (sg.mobilelegends.com)</option>
                </select>
                <button
                  onClick={handleStartTraceroute}
                  disabled={isTracing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isTracing ? "TRACING..." : "TRACE"}
                </button>
              </div>

              {/* Hop list logs */}
              <div className="space-y-2 bg-[#111827] text-emerald-300 p-3.5 rounded-2xl border border-slate-800 font-mono text-[9px] max-h-[220px] overflow-y-auto">
                <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-1 uppercase font-extrabold">
                  <span>Hop</span>
                  <span>IP/Domain</span>
                  <span>Delay</span>
                </div>
                {traceHops.length === 0 ? (
                  <p className="text-center italic py-4 text-slate-550 select-none">
                    Tekan tombol "TRACE" untuk memantau lompatan gateway backbone.
                  </p>
                ) : (
                  traceHops.map((h, i) => (
                    <div key={i} className="flex justify-between items-center py-1 animate-fadeIn border-b border-slate-950/20">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-slate-500 font-bold font-sans">#{h.hop}</span>
                        <div>
                          <span className="font-semibold block text-slate-200">{h.ip}</span>
                          <span className="text-[8px] text-slate-500 block leading-tight">{h.name}</span>
                        </div>
                      </div>
                      <span className="text-emerald-400 font-black">{h.latency}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* VIEW 7: PORT SCANNER */}
        {activeTool === "port_scanner" && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm space-y-3.5 animate-fadeIn">
            <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <Shield className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-850 dark:text-white">Pemindai Port (Security Scan)</h3>
                <p className="text-[9px] text-[#118EEA] font-bold">Menganalisis port server yang terbuka</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={portHost}
                  onChange={(e) => setPortHost(e.target.value)}
                  placeholder="Masukkan IP target, cth: 192.168.1.1"
                  className="flex-1 bg-[#F3F6F9] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  onClick={handleStartPortScan}
                  disabled={isScanningPorts}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isScanningPorts ? "MEMINDAI..." : "PINDAI"}
                </button>
              </div>

              {/* Scanned Ports Result */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {scannedPorts.length === 0 ? (
                  <p className="text-center py-6 text-slate-400 italic text-xs">
                    Belum ada port dipindai. Ketik alamat IP tujuan dan klik PINDAI.
                  </p>
                ) : (
                  scannedPorts.map((itm, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-105 dark:border-slate-850">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black font-mono text-slate-700 dark:text-slate-300">Port {itm.port}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">({itm.service})</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${
                        itm.status === "OPEN" 
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400" 
                          : "bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600"
                      }`}>
                        {itm.status === "OPEN" ? "TERBUKA" : "TERTUTUP"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* VIEW 8: DNS LOOKUP */}
        {activeTool === "dns_lookup" && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm space-y-3.5 animate-fadeIn">
            <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <Sliders className="h-5 w-5 text-purple-500" />
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-850 dark:text-white">DNS Lookup Analyzer</h3>
                <p className="text-[9px] text-[#118EEA] font-bold">Mencari record server domain name system</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={dnsHost}
                  onChange={(e) => setDnsHost(e.target.value)}
                  placeholder="Contoh: google.com atau rtnet.id"
                  className="flex-1 bg-[#F3F6F9] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  onClick={handleStartDnsLookup}
                  disabled={isResolvingDns}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50 animate-pulse-once"
                >
                  {isResolvingDns ? "LOOKUP..." : "CARI"}
                </button>
              </div>

              {/* Records List Table */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {dnsRecords.length === 0 ? (
                  <p className="text-center py-6 text-slate-400 italic text-xs">
                    Ketik nama domain di atas dan klik CARI untuk menggali records.
                  </p>
                ) : (
                  dnsRecords.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-105 dark:border-slate-850 text-xs text-left">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-[#118EEA] uppercase tracking-wider text-[9px]">{rec.type}</span>
                        <span className="text-[9px] text-slate-400">TTL: {rec.ttl}</span>
                      </div>
                      <p className="font-mono text-[10px] break-all bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-lg text-slate-800 dark:text-slate-200">
                        {rec.value}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* VIEW 9: WHOIS */}
        {activeTool === "whois" && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm space-y-3.5 animate-fadeIn">
            <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <Search className="h-5 w-5 text-rose-500" />
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-850 dark:text-white">Registry WHOIS lookup</h3>
                <p className="text-[9px] text-[#118EEA] font-bold">Menganalisis informasi kepemilikan domain</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={whoisHost}
                  onChange={(e) => setWhoisHost(e.target.value)}
                  placeholder="Ketik domain, cth: google.com"
                  className="flex-1 bg-[#F3F6F9] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  onClick={handleStartWhois}
                  disabled={isQueryingWhois}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isQueryingWhois ? "MENCARI..." : "WHOIS"}
                </button>
              </div>

              {/* WHOIS registry output pane */}
              {isQueryingWhois ? (
                <div className="text-center py-6">
                  <RefreshCw className="h-6 w-6 text-rose-500 animate-spin mx-auto" />
                  <p className="text-[10px] text-slate-400 font-bold mt-2">Menghubungi basis data WHOIS...</p>
                </div>
              ) : whoisResult ? (
                <pre className="p-3 bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 font-mono text-[8.5px] leading-relaxed max-h-[220px] overflow-y-auto whitespace-pre-wrap select-text text-left">
                  {whoisResult}
                </pre>
              ) : (
                <p className="text-center py-6 text-slate-400 italic text-xs">
                  Domain belum diperiksa. Masukan domain name dan klik WHOIS.
                </p>
              )}
            </div>
          </section>
        )}

        {/* VIEW: SPEED_TEST */}
        {activeTool === "speedtest" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Speedtest Dashboard Card */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-amber-500 animate-pulse" />
                  <div>
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-850 dark:text-white">RT Net Fiber SpeedTest</h3>
                    <p className="text-[9px] text-[#118EEA] font-bold">Server: RT-Net Server Surabaya (ID)</p>
                  </div>
                </div>
                {speedStage !== "idle" && speedStage !== "finished" && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>

              {/* GAUGE CONTAINER */}
              <div className="flex flex-col items-center justify-center py-4 relative">
                {/* SVG Semi-Circle Gauge */}
                <div className="relative w-48 h-28 flex items-center justify-center overflow-hidden">
                  <svg className="absolute top-0 w-44 h-44 transform -rotate-180" viewBox="0 0 100 100">
                    {/* Gauge background track */}
                    <path
                      d="M 15,50 A 35,35 0 1,1 85,50"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="8"
                      className="dark:stroke-slate-800"
                      strokeLinecap="round"
                    />
                    {/* Gauge active speed path */}
                    <path
                      d="M 15,50 A 35,35 0 1,1 85,50"
                      fill="none"
                      stroke={speedStage === "upload" ? "#118EEA" : "#10B981"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(currentGaugeValue / 100) * 110} 110`}
                      className="transition-all duration-100 ease-out"
                    />
                  </svg>

                  {/* Indicator info inside the dial */}
                  <div className="absolute bottom-1 text-center flex flex-col items-center z-10">
                    <span className="text-3xl font-black font-sans tracking-tight text-slate-850 dark:text-white leading-none">
                      {speedStage === "connecting" ? "..." : currentGaugeValue || "0.0"}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1 block">
                      {speedStage === "ping" ? "ms (Ping)" : "Mbps"}
                    </span>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="w-full max-w-[200px] mt-2 text-center">
                  {speedStage === "connecting" && (
                    <span className="text-[9.5px] font-black text-amber-500 uppercase tracking-widest animate-pulse">Menghubungi Server Surabaya...</span>
                  )}
                  {speedStage === "ping" && (
                    <span className="text-[9.5px] font-black text-sky-500 uppercase tracking-widest animate-pulse">Menguji Latensi & Jitter...</span>
                  )}
                  {speedStage === "download" && (
                    <span className="text-[9.5px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">Menguji Kecepatan Download...</span>
                  )}
                  {speedStage === "upload" && (
                    <span className="text-[9.5px] font-black text-sky-500 uppercase tracking-widest animate-pulse">Menguji Kecepatan Upload...</span>
                  )}
                  {speedStage === "finished" && (
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1 rounded-full uppercase tracking-wider">Test Selesai</span>
                  )}
                  {speedStage === "idle" && (
                    <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest">Sistem Siap Mulai</span>
                  )}
                </div>

                {/* Micro Progress Bar */}
                {speedStage !== "idle" && speedStage !== "finished" && (
                  <div className="w-full max-w-[220px] h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-3.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-150 rounded-full"
                      style={{ width: `${testProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* CORE RESULTS GRID DASHBOARD */}
              <div className="grid grid-cols-2 gap-2 pb-1 text-center font-sans">
                {/* PING CARD */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-1">
                  <span className="text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Latency / Jitter</span>
                  <div className="flex justify-center items-baseline space-x-1">
                    <span className="text-base font-black font-mono text-slate-800 dark:text-slate-200">
                      {speedPing ? `${speedPing}` : "--" }
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">ms</span>
                    <span className="text-slate-450 font-bold mx-0.5">/</span>
                    <span className="text-xs font-bold font-mono text-slate-500">
                      {speedJitter ? `${speedJitter}` : "--"}
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-bold">ms</span>
                  </div>
                </div>

                {/* INTERNET STATUS SPECIFICATION */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-1">
                  <span className="text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Kategori Koneksi</span>
                  <span className={`text-[10px] font-extrabold uppercase leading-none block py-0.5 ${
                    speedStage === "finished" 
                      ? speedDownload > 40 ? "text-emerald-500" : "text-amber-500"
                      : "text-slate-400"
                  }`}>
                    {speedStage === "finished" 
                      ? speedDownload > 40 ? "SANGAT CEPAT" : "OPTIMAL" 
                      : "MENUNGGU TEST..."}
                  </span>
                </div>

                {/* DOWNLOAD SPEED */}
                <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100/40 dark:border-emerald-900/10 text-center space-y-1">
                  <span className="text-[8.5px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block font-sans">Download Speed</span>
                  <div className="flex justify-center items-baseline space-x-0.5">
                    <span className="text-2xl font-black font-sans text-emerald-500">
                      {speedDownload ? speedDownload.toFixed(1) : "0.0"}
                    </span>
                    <span className="text-[9px] text-emerald-500 font-bold uppercase">Mbps</span>
                  </div>
                </div>

                {/* UPLOAD SPEED */}
                <div className="p-3 bg-sky-50/30 dark:bg-sky-955/10 rounded-2xl border border-sky-100/40 dark:border-sky-900/10 text-center space-y-1">
                  <span className="text-[8.5px] font-black text-[#118EEA] dark:text-sky-400 uppercase tracking-wider block font-sans">Upload Speed</span>
                  <div className="flex justify-center items-baseline space-x-0.5">
                    <span className="text-2xl font-black font-sans text-[#118EEA] dark:text-sky-400">
                      {speedUpload ? speedUpload.toFixed(1) : "0.0"}
                    </span>
                    <span className="text-[9px] text-sky-400 font-bold uppercase">Mbps</span>
                  </div>
                </div>
              </div>

              {/* RETEST / START ACTION TRIGGER BUTTONS */}
              <div>
                {speedStage === "idle" || speedStage === "finished" ? (
                  <button
                    onClick={startSpeedTest}
                    className="w-full bg-[#118EEA] hover:bg-[#008CE7] text-white py-3.5 rounded-2xl font-black text-xs transition uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Zap className="h-4.5 w-4.5" />
                    <span>{speedStage === "finished" ? "ULANGI TES KECEPATAN" : "MULAI TES KECEPATAN"}</span>
                  </button>
                ) : (
                  <button
                    onClick={stopSpeedTest}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-2xl font-black text-xs transition uppercase tracking-wider active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Square className="h-4.5 w-4.5" />
                    <span>HENTIKAN TES</span>
                  </button>
                )}
              </div>
            </section>

            {/* SPEED TEST HISTORIC LOGS */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm space-y-3">
              <div className="flex items-center space-x-1.5 border-b border-slate-50 dark:border-slate-800 pb-2">
                <Sliders className="h-4.5 w-4.5 text-slate-400" />
                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Histori Pengukuran Sebelumnya</h4>
              </div>

              <div className="space-y-2">
                {speedHistory.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 text-xs text-slate-600 dark:text-slate-350">
                    <div className="space-y-0.5">
                      <span className="text-[9.5px] font-extrabold block text-slate-800 dark:text-white leading-none">{item.date}</span>
                      <span className="text-[8.5px] text-slate-400 font-bold block">RT-Net Fiber Surabaya Node</span>
                    </div>
                    <div className="flex items-center space-x-3 text-right">
                      <div className="leading-tight">
                        <span className="text-[8px] text-emerald-500 font-extrabold uppercase block leading-none">DL</span>
                        <span className="font-mono font-black text-emerald-500">{item.download} <span className="text-[7.5px] font-bold">Mbps</span></span>
                      </div>
                      <div className="leading-tight">
                        <span className="text-[8px] text-[#118EEA] font-extrabold uppercase block leading-none">UL</span>
                        <span className="font-mono font-black text-[#118EEA] dark:text-sky-400">{item.upload} <span className="text-[7.5px] font-bold">Mbps</span></span>
                      </div>
                      <div className="leading-tight border-l border-slate-200 dark:border-slate-800 pl-2">
                        <span className="text-[8px] text-slate-400 font-bold block leading-none">Ping</span>
                        <span className="font-mono font-semibold text-slate-500 dark:text-slate-400">{item.ping}ms</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* VIEW: iPERF */}
        {activeTool === "iperf" && (
          <div className="space-y-4 animate-fadeIn">
            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-50 dark:border-slate-800 pb-2.5">
                <Gauge className="h-5 w-5 text-indigo-505 text-indigo-500" />
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-850 dark:text-white">iPerf3 Network Throughput</h3>
                  <p className="text-[9px] text-indigo-500 font-bold">Pemeriksa Bandwidth TCP/UDP Port 5201</p>
                </div>
              </div>

              {/* Configuration panel */}
              <div className="grid grid-cols-3 gap-2 text-[10px] bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Host IP</span>
                  <span className="font-mono font-extrabold text-slate-700 dark:text-slate-300">103.189.96.68</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Server Port</span>
                  <span className="font-mono font-extrabold text-[#118EEA]">5201 (TCP)</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Durasi</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">5 Detik</span>
                </div>
              </div>

              {/* Monospace Console Log Container */}
              <div className="bg-[#0f172a] text-slate-300 p-3.5 rounded-2xl border border-slate-900 font-mono text-[9px] space-y-1 relative max-h-[190px] overflow-y-auto">
                <div className="absolute top-2 right-2 flex items-center space-x-1.5 bg-black/40 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-slate-500">
                  <Terminal className="h-2.5 w-2.5 text-indigo-400" />
                  <span>iPerf Client</span>
                </div>
                <div className="text-[8px] font-extrabold uppercase text-slate-500 border-b border-slate-800 pb-1 mr-12 select-none mb-2">
                  CLIENT THROUGHPUT STREAM
                </div>
                {iperfLogs.length === 0 ? (
                  <p className="text-center italic py-6 text-slate-550 select-none">
                    iPerf siap. Tekan tombol MULAI IPERF TEST untuk merekam bitrates transisi stream.
                  </p>
                ) : (
                  iperfLogs.map((log, idx) => (
                    <div key={idx} className="whitespace-pre transition-all duration-75 text-left">
                      {log.startsWith("[  5]  ") || log.startsWith("[ ID]") ? (
                        <span className="text-emerald-400">{log}</span>
                      ) : log.includes("Connecting") || log.includes("Establish") ? (
                        <span className="text-slate-400 font-semibold">{log}</span>
                      ) : log.includes("successful") ? (
                        <span className="text-sky-400 font-black">{log}</span>
                      ) : (
                        <span className="text-slate-200">{log}</span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Action and Summary Results */}
              <div className="space-y-3">
                {iperfStage === "finished" && (
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/10 p-2 rounded-xl border border-indigo-100/50 dark:border-indigo-900/40 leading-none">
                      <span className="text-[8px] font-black text-indigo-500 uppercase block tracking-wider">Bandwidth</span>
                      <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">{iperfBandwidth} Mbps</span>
                    </div>
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/10 p-2 rounded-xl border border-indigo-100/50 dark:border-indigo-900/40 leading-none">
                      <span className="text-[8px] font-black text-indigo-500 uppercase block tracking-wider">Jitter</span>
                      <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">{iperfJitter} ms</span>
                    </div>
                  </div>
                )}

                {iperfStage === "idle" || iperfStage === "finished" ? (
                  <button
                    onClick={startIperfTest}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-black text-xs transition uppercase tracking-wider flex items-center justify-center space-x-1.5 cursor-pointer animate-pulse-once"
                  >
                    <Gauge className="h-4 w-4" />
                    <span>{iperfStage === "finished" ? "ULANGI TES IPERF" : "MULAI IPERF TEST"}</span>
                  </button>
                ) : (
                  <button
                    onClick={stopIperfTest}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-2xl font-black text-xs transition uppercase tracking-wider flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Square className="h-4 w-4" />
                    <span>HENTIKAN TES</span>
                  </button>
                )}
              </div>
            </section>
          </div>
        )}


      </div>
    </div>
  );
};
