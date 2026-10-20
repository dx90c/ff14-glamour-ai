using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

public static class FF14LocalServer {
    static TcpListener listener;
    static string root;
    static int port;
    static readonly Dictionary<string,string> types = new Dictionary<string,string>(StringComparer.OrdinalIgnoreCase) {
        {".html","text/html; charset=utf-8"},{".js","text/javascript"},{".mjs","text/javascript"},
        {".json","application/json; charset=utf-8"},{".wasm","application/wasm"},{".tar","application/octet-stream"},
        {".gif","image/gif"},{".png","image/png"},{".jpg","image/jpeg"},{".svg","image/svg+xml"},
        {".txt","text/plain; charset=utf-8"},{".md","text/plain; charset=utf-8"}
    };
    public static int Start(string directory,int preferredPort) {
        root = Path.GetFullPath(directory).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        if (!File.Exists(Path.Combine(root,"index.html"))) throw new FileNotFoundException("Extract the complete ZIP before running start.bat.");
        for (int i=0;i<30;i++) {
            listener = new TcpListener(IPAddress.Loopback,preferredPort+i);
            try {listener.Start();port=preferredPort+i;break;}
            catch (SocketException) {listener.Stop();listener=null;}
        }
        if (listener==null) throw new IOException("No available local port. Close another copy and try again.");
        Task.Factory.StartNew(delegate {
            while (listener != null) {
                try {var client=listener.AcceptTcpClient();Task.Factory.StartNew(()=>Serve(client));}
                catch (SocketException) {break;} catch (ObjectDisposedException) {break;}
            }
        },TaskCreationOptions.LongRunning);
        return port;
    }
    public static void Stop() {var current=listener;listener=null;if(current!=null)current.Stop();}
    static void Header(Stream stream,int code,string reason,string type,long size,bool keepAlive=false) {
        byte[] bytes=Encoding.ASCII.GetBytes("HTTP/1.1 "+code+" "+reason+"\r\nContent-Type: "+type+"\r\nContent-Length: "+size+"\r\nConnection: "+(keepAlive?"keep-alive":"close")+"\r\nX-Content-Type-Options: nosniff\r\nCache-Control: no-cache\r\n\r\n");
        stream.Write(bytes,0,bytes.Length);
    }
    static void Error(Stream stream,int code,string reason) {
        byte[] bytes=Encoding.UTF8.GetBytes(reason);Header(stream,code,reason,"text/plain; charset=utf-8",bytes.Length);stream.Write(bytes,0,bytes.Length);
    }
    static void Serve(TcpClient client) {
        using(client) {
            try {
                client.ReceiveTimeout=5000;client.SendTimeout=60000;client.Client.LingerState=new LingerOption(true,5);
                using(var stream=client.GetStream()) {
                    // Reuse the connection so large responses finish before an idle socket is closed.
                    while(true) {
                        // Bound request headers; never accept uploads or expose arbitrary local files.
                        var bytes=new List<byte>();int value;
                        while(bytes.Count<16384 && (value=stream.ReadByte())>=0) {
                            bytes.Add((byte)value);int n=bytes.Count;
                            if(n>=4 && bytes[n-4]==13 && bytes[n-3]==10 && bytes[n-2]==13 && bytes[n-1]==10)break;
                        }
                        if(bytes.Count==0)return;
                        if(bytes.Count>=16384){Error(stream,431,"Request Header Fields Too Large");return;}
                        string[] lines=Encoding.ASCII.GetString(bytes.ToArray()).Split(new[]{"\r\n"},StringSplitOptions.None);
                        string[] request=lines[0].Split(' ');
                        if(request.Length!=3){Error(stream,400,"Bad Request");return;}
                        if(request[0]!="GET" && request[0]!="HEAD"){Error(stream,405,"Method Not Allowed");return;}
                        string host=null;
                        foreach(string line in lines)if(line.StartsWith("Host:",StringComparison.OrdinalIgnoreCase))host=line.Substring(5).Trim();
                        if(host!="127.0.0.1:"+port && host!="localhost:"+port){Error(stream,403,"Forbidden");return;}
                        string url=Uri.UnescapeDataString(request[1].Split('?')[0]);
                        if(url=="/")url="/index.html";
                        bool allowed=url=="/index.html" || url=="/ff14_database.json" || url=="/README.md" ||
                            url.StartsWith("/ocr/",StringComparison.Ordinal) || url.StartsWith("/xlsx/",StringComparison.Ordinal) || url.StartsWith("/assets/",StringComparison.Ordinal);
                        if(!allowed || url.Contains("\\") || url.Contains("\0")){Error(stream,404,"Not Found");return;}
                        string file=Path.GetFullPath(Path.Combine(root,url.TrimStart('/').Replace('/',Path.DirectorySeparatorChar)));
                        string type;
                        if(!file.StartsWith(root,StringComparison.OrdinalIgnoreCase) || !types.TryGetValue(Path.GetExtension(file),out type) || !File.Exists(file)){Error(stream,404,"Not Found");return;}
                        using(var content=File.OpenRead(file)) {
                            Header(stream,200,"OK",type,content.Length,true);
                            if(request[0]=="GET")content.CopyTo(stream);
                            stream.Flush();
                        }
                    }
                }
            } catch(IOException) {} catch(Exception e) {Console.Error.WriteLine("Request failed: " + e.GetType().Name);}
        }
    }
}
