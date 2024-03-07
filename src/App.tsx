import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { Button, Card, Input, Radio } from "antd";

function App() {
  const [zkyInstalled, setZkyInstalled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [publicKey, setPublicKey] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState({
    confirmed: 0,
    unconfirmed: 0,
    total: 0,
  });
  const [network, setNetwork] = useState("livenet");

  const getBasicInfo = async () => {
    const zky = (window as any).zky;
    const [address] = await zky.getAccounts();
    setAddress(address);

    const publicKey = await zky.getPublicKey();
    setPublicKey(publicKey);

    const balance = await zky.getBalance();
    setBalance(balance);

    const network = await zky.getNetwork();
    setNetwork(network);
  };

  const selfRef = useRef<{ accounts: string[] }>({
    accounts: [],
  });
  const self = selfRef.current;
  const handleAccountsChanged = (_accounts: string[]) => {
    if (self.accounts[0] === _accounts[0]) {
      // prevent from triggering twice
      return;
    }
    self.accounts = _accounts;
    if (_accounts.length > 0) {
      setAccounts(_accounts);
      setConnected(true);

      setAddress(_accounts[0]);

      getBasicInfo();
    } else {
      setConnected(false);
    }
  };

  const handleNetworkChanged = (network: string) => {
    setNetwork(network);
    getBasicInfo();
  };

  useEffect(() => {

    async function checkZky() {
      let zky = (window as any).zky;

      for (let i = 1; i < 10 && !zky; i += 1) {
          await new Promise((resolve) => setTimeout(resolve, 100*i));
          zky = (window as any).zky;
      }

      if(zky){
          setZkyInstalled(true);
      }else if (!zky)
          return;

      zky.getAccounts().then((accounts: string[]) => {
          handleAccountsChanged(accounts);
      });

      zky.on("accountsChanged", handleAccountsChanged);
      zky.on("networkChanged", handleNetworkChanged);

      return () => {
          zky.removeListener("accountsChanged", handleAccountsChanged);
          zky.removeListener("networkChanged", handleNetworkChanged);
      };
    }

    checkZky().then();
  }, []);

  if (!zkyInstalled) {
    return (
      <div className="App">
        <header className="App-header">
          <div>
            <Button
              onClick={() => {
                window.location.href = "https://zkywallet.com";
              }}
            >
              Install Zky Wallet
            </Button>
          </div>
        </header>
      </div>
    );
  }
  const zky = (window as any).zky;
  return (
    <div className="App">
      <header className="App-header">
        <p>Zky Wallet Demo</p>

        {connected ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Card
              size="small"
              title="Basic Info"
              style={{ width: 300, margin: 10 }}
            >
              <div style={{ textAlign: "left", marginTop: 10 }}>
                <div style={{ fontWeight: "bold" }}>Address:</div>
                <div style={{ wordWrap: "break-word" }}>{address}</div>
              </div>

              <div style={{ textAlign: "left", marginTop: 10 }}>
                <div style={{ fontWeight: "bold" }}>PublicKey:</div>
                <div style={{ wordWrap: "break-word" }}>{publicKey}</div>
              </div>

              <div style={{ textAlign: "left", marginTop: 10 }}>
                <div style={{ fontWeight: "bold" }}>Balance: (Satoshis)</div>
                <div style={{ wordWrap: "break-word" }}>{balance.total}</div>
              </div>
            </Card>

            <Card
              size="small"
              title="Switch Network"
              style={{ width: 300, margin: 10 }}
            >
              <div style={{ textAlign: "left", marginTop: 10 }}>
                <div style={{ fontWeight: "bold" }}>Network:</div>
                <Radio.Group
                  onChange={async (e) => {
                    const network = await zky.switchNetwork(e.target.value);
                    setNetwork(network);
                  }}
                  value={network}
                >
                  <Radio value={"livenet"}>livenet</Radio>
                  <Radio value={"testnet"}>testnet</Radio>
                </Radio.Group>
              </div>
            </Card>

            <SignPsbtCard />
            <SignMessageCard />
            <SignBip322MessageCard />
            <MultiSignBip322MessageCard />
            <PushTxCard />
            <PushPsbtCard />
            <SendBitcoin />
          </div>
        ) : (
          <div>
            <Button
              onClick={async () => {
                const result = await zky.requestAccounts();
                handleAccountsChanged(result);
              }}
            >
              Connect Zky Wallet
            </Button>
          </div>
        )}
      </header>
    </div>
  );
}

function SignPsbtCard() {
  const [psbtHex, setPsbtHex] = useState("");
  const [psbtResult, setPsbtResult] = useState("");
  return (
    <Card size="small" title="Sign Psbt" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>PsbtHex:</div>
        <Input
          defaultValue={psbtHex}
          onChange={(e) => {
            setPsbtHex(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Result:</div>
        <div style={{ wordWrap: "break-word" }}>{psbtResult}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const psbtResult = await (window as any).zky.signPsbt(psbtHex);
            setPsbtResult(psbtResult);
          } catch (e) {
            setPsbtResult((e as any).message);
          }
        }}
      >
        Sign Psbt
      </Button>
    </Card>
  );
}

function SignMessageCard() {
  const [message, setMessage] = useState("hello world~");
  const [signature, setSignature] = useState("");
  return (
    <Card size="small" title="Sign Message" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Message:</div>
        <Input
          defaultValue={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Signature:</div>
        <div style={{ wordWrap: "break-word" }}>{signature}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          const signature = await (window as any).zky.signMessage(message);
          setSignature(signature);
        }}
      >
        Sign Message
      </Button>
    </Card>
  );
}

function SignBip322MessageCard() {
  const [message, setMessage] = useState("hello world~");
  const [signature, setSignature] = useState("");
  return (
    <Card size="small" title="Bip322 Sign Message" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Message:</div>
        <Input
          defaultValue={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Signature:</div>
        <div style={{ wordWrap: "break-word" }}>{signature}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          const signature = await (window as any).zky.signMessage(message, "bip322-simple");
          setSignature(signature);
        }}
      >
        Sign Message
      </Button>
    </Card>
  );
}

function MultiSignBip322MessageCard() {
  const [message1, setMessage1] = useState("hello world 1~");
  const [message2, setMessage2] = useState("hello world 2~");
  const [signatures, setSignatures] = useState([]);
  return (
    <Card size="small" title="Bip322 Multi Message Sign" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Message 1:</div>
        <Input
          defaultValue={message1}
          onChange={(e) => {
            setMessage1(e.target.value);
          }}
        ></Input>
        <div style={{ fontWeight: "bold", marginTop: 10 }}>Message 2:</div>
        <Input
          defaultValue={message2}
          onChange={(e) => {
            setMessage2(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Signature 1:</div>
        <div style={{ wordWrap: "break-word" }}>{signatures[0]}</div>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Signature 2:</div>
        <div style={{ wordWrap: "break-word" }}>{signatures[1]}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          const signatures = await (window as any).zky.signMultipleMessages([message1, message2], "bip322-simple");
          setSignatures(signatures); // Expecting a string[] of signatures
        }}
      >
        Sign Messages
      </Button>
    </Card>
  );
}

function PushTxCard() {
  const [rawtx, setRawtx] = useState("");
  const [txid, setTxid] = useState("");
  return (
    <Card
      size="small"
      title="Push Transaction Hex"
      style={{ width: 300, margin: 10 }}
    >
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>rawtx:</div>
        <Input
          defaultValue={rawtx}
          onChange={(e) => {
            setRawtx(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>txid:</div>
        <div style={{ wordWrap: "break-word" }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const txid = await (window as any).zky.pushTx(rawtx);
            setTxid(txid);
          } catch (e) {
            setTxid((e as any).message);
          }
        }}
      >
        PushTx
      </Button>
    </Card>
  );
}

function PushPsbtCard() {
  const [psbtHex, setPsbtHex] = useState("");
  const [txid, setTxid] = useState("");
  return (
    <Card size="small" title="Push Psbt Hex" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>psbt hex:</div>
        <Input
          defaultValue={psbtHex}
          onChange={(e) => {
            setPsbtHex(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>txid:</div>
        <div style={{ wordWrap: "break-word" }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const txid = await (window as any).zky.pushPsbt(psbtHex);
            setTxid(txid);
          } catch (e) {
            setTxid((e as any).message);
          }
        }}
      >
        pushPsbt
      </Button>
    </Card>
  );
}

function SendBitcoin() {
  const [toAddress, setToAddress] = useState(
    "tb1qmfla5j7cpdvmswtruldgvjvk87yrflrfsf6hh0"
  );
  const [satoshis, setSatoshis] = useState(1000);
  const [txid, setTxid] = useState("");
  return (
    <Card size="small" title="Send Bitcoin" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Receiver Address:</div>
        <Input
          defaultValue={toAddress}
          onChange={(e) => {
            setToAddress(e.target.value);
          }}
        ></Input>
      </div>

      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Amount: (satoshis)</div>
        <Input
          defaultValue={satoshis}
          onChange={(e) => {
            setSatoshis(parseInt(e.target.value));
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>txid:</div>
        <div style={{ wordWrap: "break-word" }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const txid = await (window as any).zky.sendBitcoin(
              toAddress,
              satoshis
            );
            setTxid(txid);
          } catch (e) {
            setTxid((e as any).message);
          }
        }}
      >
        SendBitcoin
      </Button>
    </Card>
  );
}

export default App;
