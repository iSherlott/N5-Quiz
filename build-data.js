/* build-data.js — gera data.js (QUIZ_DATA + QUIZ_CATS) a partir de bancos verificados.
   Japonês correto "por construção": tabelas explícitas (leituras de números, contadores,
   tempo, kanji, katakana) + motores de regra (conjugação de verbos/adjetivos).
   Uso: node build-data.js  →  sobrescreve data.js (lê o data.js atual só p/ herdar 'variado').
*/
"use strict";
const fs = require("fs");

/* ---------- RNG determinístico (LCG) p/ embaralhar opções de forma reprodutível ---------- */
let _seed = 20260530;
function rnd(){ _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; }
function shuffle(a){ a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function sample(pool, n, exclude){
  const set = new Set(exclude||[]); const out=[]; const p=shuffle(pool);
  for(const x of p){ if(out.length>=n) break; if(set.has(x)) continue; if(out.indexOf(x)>=0) continue; out.push(x); }
  return out;
}

/* ---------- montador de questão ---------- */
const OUT = [];
const seenQ = new Set();
function pushQ(c, q, correct, distractorPool, extra){
  if(seenQ.has(q)) return false;
  const ds = sample(distractorPool.filter(x=>x!==correct), 3, [correct]);
  if(ds.length < 3) return false;
  const opts = shuffle([correct, ...ds]);
  const a = opts.indexOf(correct);
  if(a < 0) return false;
  if(new Set(opts).size !== 4) return false;
  seenQ.add(q);
  const item = { q, o: opts, a, c };
  if(extra) Object.assign(item, extra); // campos extras p/ layout (ex.: f=forma, w=palavra, m=significado)
  OUT.push(item);
  return true;
}

/* =========================================================================================
   MOTOR DE CONJUGAÇÃO DE VERBOS (hiragana)
   ========================================================================================= */
const U2I = {"う":"い","く":"き","ぐ":"ぎ","す":"し","つ":"ち","ぬ":"に","ぶ":"び","む":"み","る":"り"};
const U2A = {"う":"わ","く":"か","ぐ":"が","す":"さ","つ":"た","ぬ":"な","ぶ":"ば","む":"ま","る":"ら"};
function godanTe(stem, last, dakuten){ // stem = sem última sílaba
  if("うつる".indexOf(last)>=0) return stem + (dakuten?"った":"って");
  if("ぬぶむ".indexOf(last)>=0) return stem + (dakuten?"んだ":"んで");
  if(last==="く") return stem + (dakuten?"いた":"いて");
  if(last==="ぐ") return stem + (dakuten?"いだ":"いで");
  if(last==="す") return stem + (dakuten?"した":"して");
  return stem + (dakuten?"った":"って");
}
function conjVerb(hira, group){
  const last = hira.slice(-1), stem = hira.slice(0,-1);
  if(group==="g2"){ // ichidan
    return { masu:stem+"ます", masen:stem+"ません", mashita:stem+"ました", masendeshita:stem+"ませんでした",
             te:stem+"て", nai:stem+"ない", ta:stem+"た" };
  }
  if(group==="irr"){
    if(hira.endsWith("する")){ const b=hira.slice(0,-2);
      return { masu:b+"します", masen:b+"しません", mashita:b+"しました", masendeshita:b+"しませんでした",
               te:b+"して", nai:b+"しない", ta:b+"した" }; }
    if(hira.endsWith("くる")){ const b=hira.slice(0,-2);
      return { masu:b+"きます", masen:b+"きません", mashita:b+"きました", masendeshita:b+"きませんでした",
               te:b+"きて", nai:b+"こない", ta:b+"きた" }; }
  }
  // g1 (godan)
  const i = stem + U2I[last];
  const dakuten = "ぐ".indexOf(last)>=0; // só p/ regra いて/いで; demais tratadas em godanTe
  let te, ta;
  if(hira==="いく"){ te=stem+"って"; ta=stem+"った"; } // 行く exceção
  else { te=godanTe(stem,last,false); ta=godanTe(stem,last,true); }
  const a = stem + U2A[last];
  return { masu:i+"ます", masen:i+"ません", mashita:i+"ました", masendeshita:i+"ませんでした",
           te:te, nai:a+"ない", ta:ta };
}
const FORM_LABEL = {
  masu:"presente/futuro educado (〜ます)", masen:"negativo educado (〜ません)",
  mashita:"passado educado (〜ました)", masendeshita:"passado negativo educado (〜ませんでした)",
  te:"forma て (〜て)", nai:"negativo simples (〜ない)", ta:"passado simples (〜た)"
};

/* Banco de verbos: [kanji, hiragana, pt, grupo] */
const VERBS = [
 ["会う","あう","encontrar","g1"],["言う","いう","dizer","g1"],["買う","かう","comprar","g1"],
 ["使う","つかう","usar","g1"],["歌う","うたう","cantar","g1"],["習う","ならう","aprender","g1"],
 ["洗う","あらう","lavar","g1"],["手伝う","てつだう","ajudar","g1"],["吸う","すう","inalar/fumar","g1"],
 ["思う","おもう","pensar/achar","g1"],["待つ","まつ","esperar","g1"],["持つ","もつ","segurar/ter","g1"],
 ["立つ","たつ","ficar de pé","g1"],["取る","とる","pegar","g1"],["作る","つくる","fazer/criar","g1"],
 ["売る","うる","vender","g1"],["帰る","かえる","voltar (para casa)","g1"],["知る","しる","saber","g1"],
 ["入る","はいる","entrar","g1"],["走る","はしる","correr","g1"],["切る","きる","cortar","g1"],
 ["要る","いる","precisar","g1"],["乗る","のる","embarcar/montar","g1"],["降る","ふる","cair (chuva)","g1"],
 ["分かる","わかる","entender","g1"],["終わる","おわる","terminar","g1"],["始まる","はじまる","começar (intr.)","g1"],
 ["死ぬ","しぬ","morrer","g1"],["遊ぶ","あそぶ","brincar","g1"],["呼ぶ","よぶ","chamar","g1"],
 ["飛ぶ","とぶ","voar","g1"],["読む","よむ","ler","g1"],["飲む","のむ","beber","g1"],
 ["住む","すむ","morar","g1"],["休む","やすむ","descansar","g1"],["泳ぐ","およぐ","nadar","g1"],
 ["急ぐ","いそぐ","apressar-se","g1"],["脱ぐ","ぬぐ","tirar (roupa)","g1"],["話す","はなす","falar","g1"],
 ["貸す","かす","emprestar","g1"],["返す","かえす","devolver","g1"],["消す","けす","apagar","g1"],
 ["押す","おす","empurrar","g1"],["書く","かく","escrever","g1"],["聞く","きく","ouvir/perguntar","g1"],
 ["行く","いく","ir","g1"],["歩く","あるく","caminhar","g1"],["働く","はたらく","trabalhar","g1"],
 ["着く","つく","chegar","g1"],["置く","おく","colocar","g1"],["泣く","なく","chorar","g1"],
 ["咲く","さく","florescer","g1"],
 ["見る","みる","ver","g2"],["食べる","たべる","comer","g2"],["寝る","ねる","dormir","g2"],
 ["起きる","おきる","acordar","g2"],["着る","きる","vestir","g2"],["出る","でる","sair","g2"],
 ["入れる","いれる","inserir/pôr","g2"],["教える","おしえる","ensinar","g2"],["覚える","おぼえる","memorizar","g2"],
 ["忘れる","わすれる","esquecer","g2"],["借りる","かりる","tomar emprestado","g2"],["開ける","あける","abrir","g2"],
 ["閉める","しめる","fechar","g2"],["始める","はじめる","começar (tr.)","g2"],["見せる","みせる","mostrar","g2"],
 ["答える","こたえる","responder","g2"],["考える","かんがえる","pensar/considerar","g2"],["並べる","ならべる","enfileirar","g2"],
 ["集める","あつめる","coletar","g2"],["捨てる","すてる","jogar fora","g2"],["疲れる","つかれる","cansar-se","g2"],
 ["生まれる","うまれる","nascer","g2"],["浴びる","あびる","tomar (banho)","g2"],["降りる","おりる","descer","g2"],
 ["する","する","fazer","irr"],["来る","くる","vir","irr"],["勉強する","べんきょうする","estudar","irr"],
 ["結婚する","けっこんする","casar-se","irr"],["散歩する","さんぽする","passear","irr"],["旅行する","りょこうする","viajar","irr"],
 ["練習する","れんしゅうする","praticar","irr"],["電話する","でんわする","telefonar","irr"],["質問する","しつもんする","perguntar","irr"],
 ["掃除する","そうじする","limpar","irr"],["洗濯する","せんたくする","lavar roupa","irr"],["料理する","りょうりする","cozinhar","irr"],
 // --- ampliação de banco (verbos N5 adicionais) ---
 ["払う","はらう","pagar","g1"],["送る","おくる","enviar","g1"],["戻る","もどる","voltar/retornar","g1"],
 ["登る","のぼる","escalar/subir","g1"],["困る","こまる","ficar em apuros","g1"],["笑う","わらう","rir","g1"],
 ["動く","うごく","mover-se","g1"],["続く","つづく","continuar","g1"],["曲がる","まがる","virar/dobrar","g1"],
 ["閉まる","しまる","fechar (intr.)","g1"],
 ["出かける","でかける","sair","g2"],["調べる","しらべる","investigar","g2"],["比べる","くらべる","comparar","g2"],
 ["育てる","そだてる","criar/cultivar","g2"],
 ["案内する","あんないする","guiar","irr"],["招待する","しょうたいする","convidar","irr"],
 ["説明する","せつめいする","explicar","irr"],["用意する","よういする","preparar","irr"]
];
function genVerbs(){
  const forms = ["masu","masen","mashita","masendeshita","te","nai","ta"];
  for(const [kanji,hira,pt,grp] of VERBS){
    const c = conjVerb(hira, grp);
    const allForms = forms.map(f=>c[f]);
    for(const f of forms){
      const correct = c[f];
      const pool = allForms.concat([hira]); // distratores: outras formas do mesmo verbo
      pushQ("verbo", `「${kanji}」（${pt}）— ${FORM_LABEL[f]}`, correct, pool, {f:FORM_LABEL[f], w:kanji, m:pt});
    }
  }
}

/* =========================================================================================
   ADJETIVOS — formas (i-adj e na-adj)
   ========================================================================================= */
const IADJ = [
 ["大きい","おおきい","grande"],["小さい","ちいさい","pequeno"],["新しい","あたらしい","novo"],
 ["古い","ふるい","velho"],["高い","たかい","caro/alto"],["安い","やすい","barato"],
 ["低い","ひくい","baixo"],["悪い","わるい","ruim"],["暑い","あつい","quente (clima)"],
 ["寒い","さむい","frio (clima)"],["冷たい","つめたい","frio (ao toque)"],["暖かい","あたたかい","morno"],
 ["涼しい","すずしい","fresco"],["忙しい","いそがしい","ocupado"],["楽しい","たのしい","divertido"],
 ["面白い","おもしろい","interessante"],["難しい","むずかしい","difícil"],["易しい","やさしい","fácil"],
 ["早い","はやい","cedo"],["遅い","おそい","lento/tarde"],["長い","ながい","comprido"],
 ["短い","みじかい","curto"],["広い","ひろい","amplo"],["狭い","せまい","estreito"],
 ["重い","おもい","pesado"],["軽い","かるい","leve"],["強い","つよい","forte"],
 ["弱い","よわい","fraco"],["明るい","あかるい","claro/alegre"],["暗い","くらい","escuro"],
 ["多い","おおい","muitos"],["少ない","すくない","poucos"],["美味しい","おいしい","gostoso"],
 ["甘い","あまい","doce"],["辛い","からい","picante"],["苦い","にがい","amargo"],
 ["痛い","いたい","dolorido"],["怖い","こわい","assustador"],["汚い","きたない","sujo"],
 ["近い","ちかい","perto"],["遠い","とおい","longe"],
 ["太い","ふとい","grosso"],["細い","ほそい","fino"],["深い","ふかい","profundo"],
 ["浅い","あさい","raso"],["眠い","ねむい","sonolento"],["丸い","まるい","redondo"],
 ["若い","わかい","jovem"],["嬉しい","うれしい","feliz"],["悲しい","かなしい","triste"],
 ["寂しい","さびしい","solitário"],
 ["白い","しろい","branco"],["黒い","くろい","preto"],["赤い","あかい","vermelho"],["青い","あおい","azul"],
 ["黄色い","きいろい","amarelo"],["熱い","あつい","quente (ao toque)"],["眩しい","まぶしい","ofuscante"]
];
const NAADJ = [
 ["静か","しずか","quieto"],["賑やか","にぎやか","movimentado"],["綺麗","きれい","bonito/limpo"],
 ["元気","げんき","saudável/animado"],["暇","ひま","livre (de tempo)"],["便利","べんり","conveniente"],
 ["不便","ふべん","inconveniente"],["上手","じょうず","habilidoso"],["下手","へた","inábil"],
 ["有名","ゆうめい","famoso"],["親切","しんせつ","gentil"],["大切","たいせつ","importante"],
 ["大丈夫","だいじょうぶ","tudo bem"],["大変","たいへん","difícil/duro"],["簡単","かんたん","simples"],
 ["危険","きけん","perigoso"],["安全","あんぜん","seguro"],["必要","ひつよう","necessário"],
 ["丈夫","じょうぶ","resistente"],["素敵","すてき","maravilhoso"],["真面目","まじめ","sério/aplicado"],
 ["自由","じゆう","livre"],["特別","とくべつ","especial"],["普通","ふつう","comum"],
 ["残念","ざんねん","lamentável"],["十分","じゅうぶん","suficiente"],["立派","りっぱ","esplêndido"]
];
function iForms(h){ const b=h.slice(0,-1); return {
  pres:h, neg:b+"くない", past:b+"かった", pastneg:b+"くなかった", te:b+"くて", adv:b+"く" }; }
function naForms(h){ return {
  pres:h+"です", neg:h+"じゃない", past:h+"でした", pastneg:h+"じゃなかった", te:h+"で", adv:h+"に" }; }
const IADJ_LBL = { pres:"forma presente (afirmativa)", neg:"forma negativa (〜くない)", past:"forma passada (〜かった)", pastneg:"passado negativo (〜くなかった)", te:"forma て (〜くて)", adv:"forma adverbial (〜く)" };
const NAADJ_LBL= { pres:"forma presente educada (〜です)", neg:"forma negativa (〜じゃない)", past:"forma passada (〜でした)", pastneg:"passado negativo (〜じゃなかった)", te:"forma て (〜で)", adv:"forma adverbial (〜に)" };
function genAdj(){
  for(const [kanji,hira,pt] of IADJ){
    const f=iForms(hira), all=Object.values(f);
    for(const k of Object.keys(f)){
      pushQ("adj", `「${kanji}」（${pt}）— ${IADJ_LBL[k]}`, f[k], all, {f:IADJ_LBL[k], w:kanji, m:pt});
    }
  }
  for(const [kanji,hira,pt] of NAADJ){
    const f=naForms(hira), all=Object.values(f);
    for(const k of Object.keys(f)){
      pushQ("adj", `「${kanji}」（${pt}）— ${NAADJ_LBL[k]}`, f[k], all, {f:NAADJ_LBL[k], w:kanji, m:pt});
    }
  }
}

/* =========================================================================================
   KANJI — mostra 1 kanji, escolher a leitura (hiragana)
   ========================================================================================= */
const KANJI = [
 ["一","いち","um"],["二","に","dois"],["三","さん","três"],["四","よん","quatro"],["五","ご","cinco"],
 ["六","ろく","seis"],["七","なな","sete"],["八","はち","oito"],["九","きゅう","nove"],["十","じゅう","dez"],
 ["百","ひゃく","cem"],["千","せん","mil"],["円","えん","iene"],["日","ひ","dia/sol"],["月","つき","lua/mês"],
 ["火","ひ","fogo"],["水","みず","água"],["木","き","árvore"],["金","かね","dinheiro/ouro"],["土","つち","terra"],
 ["人","ひと","pessoa"],["大","おお","grande"],["小","ちい","pequeno"],["中","なか","meio/dentro"],["山","やま","montanha"],
 ["川","かわ","rio"],["田","た","arrozal"],["力","ちから","força"],["男","おとこ","homem"],["女","おんな","mulher"],
 ["子","こ","criança"],["学","がく","estudo"],["校","こう","escola"],["先","せん","antes"],["生","せい","vida"],
 ["年","とし","ano"],["上","うえ","em cima"],["下","した","embaixo"],["左","ひだり","esquerda"],["右","みぎ","direita"],
 ["前","まえ","frente/antes"],["後","あと","depois"],["内","うち","dentro"],["外","そと","fora"],["東","ひがし","leste"],
 ["西","にし","oeste"],["南","みなみ","sul"],["北","きた","norte"],["口","くち","boca"],["目","め","olho"],
 ["耳","みみ","orelha"],["手","て","mão"],["足","あし","pé/perna"],["名","な","nome"],["雨","あめ","chuva"],
 ["電","でん","eletricidade"],["車","くるま","carro"],["駅","えき","estação"],["店","みせ","loja"],["本","ほん","livro"],
 ["父","ちち","pai"],["母","はは","mãe"],["兄","あに","irmão mais velho"],["姉","あね","irmã mais velha"],["弟","おとうと","irmão menor"],
 ["妹","いもうと","irmã menor"],["友","とも","amigo"],["国","くに","país"],["語","ご","língua"],["何","なに","o quê"],
 ["私","わたし","eu"],["毎","まい","cada"],["週","しゅう","semana"],["時","とき","tempo/hora"],["間","あいだ","intervalo"],
 ["半","はん","metade"],["午","ご","meio-dia"],["気","き","ânimo/ar"],["天","てん","céu"],["空","そら","céu/vazio"],
 ["海","うみ","mar"],["花","はな","flor"],["魚","さかな","peixe"],["肉","にく","carne"],["米","こめ","arroz cru"],
 ["茶","ちゃ","chá"],["犬","いぬ","cachorro"],["猫","ねこ","gato"],["鳥","とり","pássaro"],["白","しろ","branco"],
 ["赤","あか","vermelho"],["青","あお","azul"],["黒","くろ","preto"],["新","あたら","novo"],["古","ふる","velho"],
 ["高","たか","alto/caro"],["安","やす","barato"],["長","なが","comprido"],["多","おお","muitos"],["少","すく","poucos"],
 ["good","いい","bom"] // placeholder removido abaixo
];
function genKanji(){
  const bank = KANJI.filter(k=>k[0].length===1 && /[一-龯]/.test(k[0]));
  const readings = bank.map(k=>k[1]);
  const pts = bank.map(k=>k[2]);
  for(const [kanji,read,pt] of bank){
    // mostra só 1 kanji → escolher a leitura (hiragana)
    pushQ("kanji", `「${kanji}」は どう読みますか。`, read, readings);
    // mostra só 1 kanji → escolher o significado (português)
    pushQ("kanji", `「${kanji}」は ポルトガル語で どれですか。`, pt, pts);
  }
}

/* =========================================================================================
   KATAKANA — palavra em inglês/origem → escolher o katakana
   ========================================================================================= */
const KATA = [
 ["coffee","コーヒー","café"],["television","テレビ","TV"],["camera","カメラ","câmera"],["radio","ラジオ","rádio"],
 ["hotel","ホテル","hotel"],["restaurant","レストラン","restaurante"],["table","テーブル","mesa"],["door","ドア","porta"],
 ["pen","ペン","caneta"],["note","ノート","caderno"],["ballpoint pen","ボールペン","caneta esferográfica"],["cup","コップ","copo"],
 ["knife","ナイフ","faca"],["fork","フォーク","garfo"],["spoon","スプーン","colher"],["milk","ミルク","leite"],
 ["juice","ジュース","suco"],["beer","ビール","cerveja"],["wine","ワイン","vinho"],["party","パーティー","festa"],
 ["present","プレゼント","presente"],["card","カード","cartão"],["news","ニュース","notícias"],["sports","スポーツ","esporte"],
 ["tennis","テニス","tênis"],["soccer","サッカー","futebol"],["pool","プール","piscina"],["shower","シャワー","chuveiro"],
 ["elevator","エレベーター","elevador"],["escalator","エスカレーター","escada rolante"],["apartment","アパート","apartamento"],["department store","デパート","loja de departamentos"],
 ["supermarket","スーパー","supermercado"],["convenience store","コンビニ","loja de conveniência"],["bus","バス","ônibus"],["taxi","タクシー","táxi"],
 ["class","クラス","turma"],["test","テスト","prova"],["page","ページ","página"],["button","ボタン","botão"],
 ["pocket","ポケット","bolso"],["shirt","シャツ","camisa"],["skirt","スカート","saia"],["handkerchief","ハンカチ","lenço"],
 ["calendar","カレンダー","calendário"],["curry","カレー","curry"],["cake","ケーキ","bolo"],["ice cream","アイスクリーム","sorvete"],
 ["chocolate","チョコレート","chocolate"],["salad","サラダ","salada"],["pizza","ピザ","pizza"],["hamburger","ハンバーガー","hambúrguer"],
 ["tomato","トマト","tomate"],["banana","バナナ","banana"],["orange","オレンジ","laranja"],["lemon","レモン","limão"],
 ["guitar","ギター","violão"],["piano","ピアノ","piano"],["karaoke","カラオケ","karaokê"],["game","ゲーム","jogo"],
 ["computer","コンピューター","computador"],["personal computer","パソコン","computador pessoal"],["internet","インターネット","internet"],["email","メール","e-mail"],
 ["smartphone","スマホ","smartphone"],["America","アメリカ","EUA"],["Brazil","ブラジル","Brasil"],["video","ビデオ","vídeo"],
 ["necktie","ネクタイ","gravata"],["post (mailbox)","ポスト","caixa de correio"],["bed","ベッド","cama"],["pet","ペット","animal de estimação"],
 ["film","フィルム","filme (rolo)"],["sweater","セーター","suéter"],["bell","ベル","sino"],["gum","ガム","chiclete"],
 ["cola","コーラ","refrigerante de cola"],["sandwich","サンドイッチ","sanduíche"],["yogurt","ヨーグルト","iogurte"],["cheese","チーズ","queijo"],
 ["butter","バター","manteiga"],["suit","スーツ","terno"],["belt","ベルト","cinto"],["towel","タオル","toalha"],
 ["shampoo","シャンプー","xampu"],["slippers","スリッパ","chinelo"],["curtain","カーテン","cortina"],["sofa","ソファ","sofá"],
 ["glass","グラス","taça"],["menu","メニュー","cardápio"],["ticket","チケット","ingresso"],["coat","コート","casaco"],
 ["scarf","マフラー","cachecol"],["jam","ジャム","geleia"],["pants","パンツ","calça"],["steak","ステーキ","bife"]
];
function genKata(){
  const katas = KATA.map(k=>k[1]);
  const pts = KATA.map(k=>k[2]);
  for(const [en,kata,pt] of KATA){
    // inglês → katakana: a palavra em inglês + "como se lê?" (enunciado em japonês), opções em katakana
    pushQ("kata", `「${en}」は どう読みますか。`, kata, katas);
    // katakana → português: a palavra em katakana, opções em português (significado)
    pushQ("kata", `「${kata}」は ポルトガル語で どれですか。`, pt, pts);
  }
}

/* =========================================================================================
   PARTÍCULAS / GRAMÁTICA — frase com lacuna, escolher a partícula
   [frase com 〔〕, partícula correta]
   ========================================================================================= */
const PARTS = ["は","が","を","に","で","へ","と","も","から","まで","より","の"];
const GRAM = [
 ["わたし〔　〕がくせいです。","は"],["これ〔　〕ほんです。","は"],
 ["ねこ〔　〕います。","が"],["だれ〔　〕きましたか。","が"],
 ["ごはん〔　〕たべます。","を"],["ほん〔　〕よみます。","を"],["みず〔　〕のみます。","を"],
 ["がっこう〔　〕いきます。","へ"],["うち〔　〕かえります。","へ"],
 ["7じ〔　〕おきます。","に"],["にちようび〔　〕やすみます。","に"],["へや〔　〕います。","に"],
 ["バス〔　〕いきます。","で"],["はし〔　〕たべます。","で"],["としょかん〔　〕べんきょうします。","で"],
 ["ともだち〔　〕はなします。","と"],["かぞく〔　〕すみます。","と"],
 ["わたし〔　〕いきます。","も"],
 ["9じ〔　〕はたらきます。","から"],["えき〔　〕あるきます。","から"],
 ["ここ〔　〕えきまで とおいです。","から"],["5じ〔　〕べんきょうします。","まで"],
 ["とうきょうはおおさか〔　〕おおきいです。","より"],
 ["これはわたし〔　〕ほんです。","の"],["にほん〔　〕くるまです。","の"],
 ["コーヒー〔　〕すきです。","が"],["にほんご〔　〕わかります。","が"],
 ["でんしゃ〔　〕のります。","に"],["くるま〔　〕のります。","に"],
 ["かばん〔　〕なにが ありますか。","に"],["つくえのうえ〔　〕ねこがいます。","に"],
 ["ペン〔　〕かきます。","で"],["にほんご〔　〕はなします。","で"],
 ["あさ〔　〕ばんまで はたらきます。","から"],["くうこう〔　〕いきます。","まで"],
 ["せんせい〔　〕しつもんします。","に"],["はは〔　〕てがみをかきます。","に"],
 ["みせ〔　〕パンをかいます。","で"],["こうえん〔　〕あそびます。","で"],
 ["あめ〔　〕ふっています。","が"],["そら〔　〕あおいです。","が"],
 ["まいにち がっこう〔　〕いきます。","へ"],["きのう ともだち〔　〕あいました。","に"],
 ["ペン〔　〕てがみを かきます。","で"],["この りんご〔　〕おいしいです。","は"],
 ["なつ〔　〕あついです。","は"],["わたしはコーヒー〔　〕おちゃを のみます。","と"],
 ["くつ〔　〕みせは どこですか。","の"],["まいあさ 6じ〔　〕おきます。","に"],
 ["でんしゃ〔　〕がっこうへ いきます。","で"],["やすみは げつようび〔　〕すいようびです。","と"],
 ["この ほんは せんえん〔　〕かいました。","で"],["きょうしつ〔　〕がくせいが います。","に"],
 ["うち〔　〕えきまで あるきます。","から"],
 // --- ampliação (frases N5 com lacuna de partícula, sem ambiguidade) ---
 ["くだもの〔　〕すきです。","が"],["おかね〔　〕ありません。","が"],
 ["まいばん ほん〔　〕よみます。","を"],["くつ〔　〕かいました。","を"],
 ["きっさてん〔　〕コーヒーを のみます。","で"],["なに〔　〕たべますか。","を"],
 ["ペン〔　〕かして ください。","を"],["まど〔　〕あけて ください。","を"],
 ["6じ〔　〕おきました。","に"],["パン〔　〕たまごを たべました。","と"],
 ["くすり〔　〕のみます。","を"],["タクシー〔　〕のります。","に"],
 ["がっこう〔　〕ともだちに あいました。","で"],["8じ〔　〕うちを でます。","に"],
 ["あに〔　〕せが たかいです。","は"],["これ〔　〕だれの かばんですか。","は"],
 ["でぐち〔　〕どこですか。","は"],["ともだち〔　〕えいがを みます。","と"],
 ["スプーン〔　〕たべます。","で"],["くるま〔　〕あらいます。","を"]
];
function genGram(){
  for(const [frase, p] of GRAM){
    pushQ("gram", frase, p, PARTS, {w:frase});
  }
}

/* =========================================================================================
   NÚMEROS — função de leitura (1..99999) com mudanças fonéticas
   ========================================================================================= */
const ONES = ["","いち","に","さん","よん","ご","ろく","なな","はち","きゅう"];
function readBelow1000(n){
  let s=""; const h=Math.floor(n/100), r=n%100;
  if(h){ const HMAP={1:"ひゃく",3:"さんびゃく",6:"ろっぴゃく",8:"はっぴゃく"}; s += HMAP[h]||(ONES[h]+"ひゃく"); }
  const t=Math.floor(r/10), o=r%10;
  if(t){ s += (t===1?"じゅう":ONES[t]+"じゅう"); }
  if(o){ s += ONES[o]; }
  return s;
}
function readNum(n){
  if(n===0) return "ゼロ";
  let s=""; const man=Math.floor(n/10000), rest=n%10000;
  if(man){ s += (man===1?"いち":readNum(man)) + "まん"; }
  const th=Math.floor(rest/1000), r2=rest%1000;
  if(th){ const TMAP={1:"せん",3:"さんぜん",8:"はっせん"}; s += TMAP[th]||(ONES[th]+"せん"); }
  s += readBelow1000(r2);
  return s;
}
function genNumero(){
  // valores em ienes (円) — apresenta o preço e pede a leitura
  // agrupamento japonês: separa a cada 4 dígitos (万), ex.: 100000 → "10 0000"
  const fmt = n => String(n).replace(/\B(?=(\d{4})+(?!\d))/g, " ");
  const yen = [];
  const add = n => { if(yen.indexOf(n)<0) yen.push(n); };
  for(let n=1;n<=50;n++) add(n);            // 1..50 ienes
  for(let n=60;n<=200;n+=10) add(n);         // 60..200
  for(let n=250;n<=1000;n+=50) add(n);       // 250..1000
  for(let n=1100;n<=3000;n+=100) add(n);     // 1100..3000
  for(let n=3500;n<=10000;n+=500) add(n);    // 3500..10000
  [12000,15000,20000,30000,50000,100000].forEach(add);
  const reads = yen.map(v=>readNum(v)+"えん");
  for(const v of yen){
    const read = readNum(v)+"えん";
    pushQ("numero", `${v}円 の 読み方`, read, reads, {f:"valor em ienes 円", w:fmt(v)+"円"});
  }
}

/* =========================================================================================
   CONTADORES — tabela explícita de leituras (1..10)
   ========================================================================================= */
const COUNTERS = {
 "個":{pt:"objetos pequenos", r:["いっこ","にこ","さんこ","よんこ","ごこ","ろっこ","ななこ","はっこ","きゅうこ","じゅっこ"]},
 "枚":{pt:"objetos planos", r:["いちまい","にまい","さんまい","よんまい","ごまい","ろくまい","ななまい","はちまい","きゅうまい","じゅうまい"]},
 "本":{pt:"objetos longos", r:["いっぽん","にほん","さんぼん","よんほん","ごほん","ろっぽん","ななほん","はっぽん","きゅうほん","じゅっぽん"]},
 "冊":{pt:"livros/cadernos", r:["いっさつ","にさつ","さんさつ","よんさつ","ごさつ","ろくさつ","ななさつ","はっさつ","きゅうさつ","じゅっさつ"]},
 "杯":{pt:"copos/xícaras", r:["いっぱい","にはい","さんばい","よんはい","ごはい","ろっぱい","ななはい","はっぱい","きゅうはい","じゅっぱい"]},
 "人":{pt:"pessoas", r:["ひとり","ふたり","さんにん","よにん","ごにん","ろくにん","ななにん","はちにん","きゅうにん","じゅうにん"]},
 "匹":{pt:"animais pequenos", r:["いっぴき","にひき","さんびき","よんひき","ごひき","ろっぴき","ななひき","はっぴき","きゅうひき","じゅっぴき"]},
 "台":{pt:"máquinas/veículos", r:["いちだい","にだい","さんだい","よんだい","ごだい","ろくだい","ななだい","はちだい","きゅうだい","じゅうだい"]},
 "階":{pt:"andares", r:["いっかい","にかい","さんがい","よんかい","ごかい","ろっかい","ななかい","はっかい","きゅうかい","じゅっかい"]},
 "歳":{pt:"idade (anos)", r:["いっさい","にさい","さんさい","よんさい","ごさい","ろくさい","ななさい","はっさい","きゅうさい","じゅっさい"]}
};
function genContador(){
  const allR = [].concat(...Object.values(COUNTERS).map(c=>c.r));
  for(const [cnt, info] of Object.entries(COUNTERS)){
    for(let n=1;n<=10;n++){
      const correct = info.r[n-1];
      // leitura
      pushQ("contador", `「${n}${cnt}」（${info.pt}）の正しい読み方はどれですか。`, correct, info.r.concat(allR));
      // significado: leitura → quantidade+contador
      pushQ("contador", `「${correct}」が表すのはどれですか。`, `${n}${cnt}`, Array.from({length:10},(_,i)=>`${i+1}${cnt}`));
    }
  }
}

/* =========================================================================================
   TEMPO E DATAS — tabelas explícitas
   ========================================================================================= */
const HOURS = ["","いちじ","にじ","さんじ","よじ","ごじ","ろくじ","しちじ","はちじ","くじ","じゅうじ","じゅういちじ","じゅうにじ"];
const MIN = { 1:"いっぷん",2:"にふん",3:"さんぷん",4:"よんぷん",5:"ごふん",6:"ろっぷん",7:"ななふん",8:"はっぷん",9:"きゅうふん",10:"じゅっぷん",15:"じゅうごふん",20:"にじゅっぷん",30:"さんじゅっぷん",40:"よんじゅっぷん",45:"よんじゅうごふん",50:"ごじゅっぷん" };
const MONTHS = ["","いちがつ","にがつ","さんがつ","しがつ","ごがつ","ろくがつ","しちがつ","はちがつ","くがつ","じゅうがつ","じゅういちがつ","じゅうにがつ"];
const DAYS = {1:"ついたち",2:"ふつか",3:"みっか",4:"よっか",5:"いつか",6:"むいか",7:"なのか",8:"ようか",9:"ここのか",10:"とおか",14:"じゅうよっか",20:"はつか",24:"にじゅうよっか"};
const WEEK = {"月曜日":"げつようび","火曜日":"かようび","水曜日":"すいようび","木曜日":"もくようび","金曜日":"きんようび","土曜日":"どようび","日曜日":"にちようび"};
function genTempo(){
  const allHour = HOURS.filter(Boolean);
  for(let h=1;h<=12;h++){ pushQ("tempo", `「${h}時」の読み方はどれですか。`, HOURS[h], allHour); }
  const allMin = Object.values(MIN);
  for(const m of Object.keys(MIN)){ pushQ("tempo", `「${m}分」の読み方はどれですか。`, MIN[m], allMin); }
  const allMonth = MONTHS.filter(Boolean);
  for(let m=1;m<=12;m++){ pushQ("tempo", `「${m}月」の読み方はどれですか。`, MONTHS[m], allMonth); }
  const allWeek = Object.values(WEEK);
  for(const [k,v] of Object.entries(WEEK)){ pushQ("tempo", `「${k}」の読み方はどれですか。`, v, allWeek); }
  // dias do mês (irregulares + alguns regulares)
  const dayKeys = [1,2,3,4,5,6,7,8,9,10,14,20,24];
  const dayRead = dayKeys.map(d=>DAYS[d]);
  for(const d of dayKeys){ pushQ("tempo", `「${d}日」の読み方はどれですか。`, DAYS[d], dayRead); }
}

/* =========================================================================================
   VOCABULÁRIO — frase em japonês (kanji) → opções em hiragana; e o inverso.
   Banco de substantivos com tipo p/ escolher template e distratores coerentes.
   [kanji, hiragana, pt, tipo]
   ========================================================================================= */
const NOUNS = [
 ["父","ちち","pai","pessoa"],["母","はは","mãe","pessoa"],["兄","あに","irmão mais velho","pessoa"],
 ["姉","あね","irmã mais velha","pessoa"],["弟","おとうと","irmão menor","pessoa"],["妹","いもうと","irmã menor","pessoa"],
 ["先生","せんせい","professor","pessoa"],["学生","がくせい","estudante","pessoa"],["子供","こども","criança","pessoa"],
 ["男","おとこ","homem","pessoa"],["女","おんな","mulher","pessoa"],["友達","ともだち","amigo","pessoa"],
 ["魚","さかな","peixe","comida"],["肉","にく","carne","comida"],["水","みず","água","comida"],
 ["卵","たまご","ovo","comida"],["野菜","やさい","legumes","comida"],["果物","くだもの","fruta","comida"],
 ["牛乳","ぎゅうにゅう","leite","comida"],["寿司","すし","sushi","comida"],["茶","ちゃ","chá","comida"],
 ["本","ほん","livro","objeto"],["車","くるま","carro","objeto"],["時計","とけい","relógio","objeto"],
 ["鞄","かばん","bolsa","objeto"],["傘","かさ","guarda-chuva","objeto"],["靴","くつ","sapato","objeto"],
 ["服","ふく","roupa","objeto"],["椅子","いす","cadeira","objeto"],["机","つくえ","mesa","objeto"],
 ["電話","でんわ","telefone","objeto"],["鍵","かぎ","chave","objeto"],["新聞","しんぶん","jornal","objeto"],
 ["写真","しゃしん","foto","objeto"],["手紙","てがみ","carta","objeto"],["花","はな","flor","objeto"],
 ["犬","いぬ","cachorro","animal"],["猫","ねこ","gato","animal"],["鳥","とり","pássaro","animal"],
 ["馬","うま","cavalo","animal"],["牛","うし","vaca","animal"],
 ["学校","がっこう","escola","lugar"],["駅","えき","estação","lugar"],["病院","びょういん","hospital","lugar"],
 ["銀行","ぎんこう","banco","lugar"],["図書館","としょかん","biblioteca","lugar"],["公園","こうえん","parque","lugar"],
 ["店","みせ","loja","lugar"],["家","いえ","casa","lugar"],["部屋","へや","quarto","lugar"],
 ["会社","かいしゃ","empresa","lugar"],["山","やま","montanha","lugar"],["海","うみ","mar","lugar"],
 // --- ampliação do banco (substantivos N5) ---
 ["名前","なまえ","nome","objeto"],["言葉","ことば","palavra","objeto"],["仕事","しごと","trabalho","objeto"],
 ["道","みち","rua / caminho","lugar"],["町","まち","cidade","lugar"],["国","くに","país","lugar"],
 ["天気","てんき","tempo (clima)","objeto"],["音楽","おんがく","música","objeto"],["映画","えいが","filme","objeto"],
 ["旅行","りょこう","viagem","objeto"],["食べ物","たべもの","comida","comida"],["飲み物","のみもの","bebida","comida"],
 ["建物","たてもの","prédio","lugar"],["飛行機","ひこうき","avião","objeto"],["自転車","じてんしゃ","bicicleta","objeto"],
 ["切符","きっぷ","bilhete","objeto"],["切手","きって","selo","objeto"],["財布","さいふ","carteira","objeto"],
 ["眼鏡","めがね","óculos","objeto"],["帽子","ぼうし","chapéu","objeto"],["宿題","しゅくだい","lição de casa","objeto"],
 ["質問","しつもん","pergunta","objeto"],["試験","しけん","prova / exame","objeto"],["辞書","じしょ","dicionário","objeto"],
 ["雑誌","ざっし","revista","objeto"],["地図","ちず","mapa","objeto"],["窓","まど","janela","objeto"],
 ["電気","でんき","luz / eletricidade","objeto"],["料理","りょうり","prato / culinária","comida"],["砂糖","さとう","açúcar","comida"],
 ["塩","しお","sal","comida"],["鉛筆","えんぴつ","lápis","objeto"]
];
function nounsOfType(t){ return NOUNS.filter(n=>n[3]===t); }
const VOCAB_TPL = {
 pessoa: ["「{X}、はやく おきて！」だれの ことですか。","「{X}は がくせいです。」だれの ことですか。","「{X}と はなしました。」だれと はなしましたか。","「{X}が きました。」だれが きましたか。"],
 comida: ["「{X}を たべました。」なにを たべましたか。","「{X}が すきです。」なにが すきですか。","「{X}は おいしいです。」なにの ことですか。","「{X}を かいました。」なにを かいましたか。"],
 objeto: ["「{X}を かいました。」なにを かいましたか。","「これは {X}です。」これは なんですか。","「{X}を つかいます。」なにを つかいますか。","「{X}が あります。」なにが ありますか。"],
 animal: ["「{X}が います。」なにが いますか。","「{X}は かわいいです。」なにの ことですか。","「{X}を かっています。」なにを かっていますか。","「{X}が すきです。」なにが すきですか。"],
 lugar:  ["「{X}へ いきます。」どこへ いきますか。","「{X}は どこですか。」どこの ことですか。","「{X}で あいましょう。」どこで あいますか。","「{X}に います。」どこに いますか。"]
};
function genVocab(){
  // 1 palavra solta (substantivo, forma dicionário). Dois sentidos:
  // A) japonês (kanji + furigana) → português ; B) português → leitura (hiragana)
  const allPt = NOUNS.map(n=>n[2]);
  const allHira = NOUNS.map(n=>n[1]);
  for(const [kanji,hira,pt] of NOUNS){
    // A: mostra a palavra (kanji com furigana) → escolher o significado
    pushQ("vocab", `${kanji} → significado`, pt, allPt, {f:"japonês → português", w:kanji, r:hira});
    // B: mostra o português → escolher a leitura em hiragana
    pushQ("vocab", `${pt} → leitura`, hira, allHira, {f:"português → leitura", w:pt});
  }
}

/* =========================================================================================
   KANA — frase simples só em kana → escolher a tradução em pt (templates seguros)
   ========================================================================================= */
// [kana, pt, tipo]: item = coisa comprável (comida/bebida/objeto); animal; lugar
const KANA_NOUNS = [
 ["すし","sushi","item"],["みず","água","item"],["おちゃ","chá","item"],["ぱん","pão","item"],
 ["たまご","ovo","item"],["さかな","peixe","item"],["にく","carne","item"],["みかん","tangerina","item"],
 ["りんご","maçã","item"],["やさい","legumes","item"],["くだもの","fruta","item"],["ぎゅうにゅう","leite","item"],
 ["くるま","carro","item"],["ほん","livro","item"],["かばん","bolsa","item"],["くつ","sapato","item"],
 ["とけい","relógio","item"],["かさ","guarda-chuva","item"],["でんわ","telefone","item"],["しんぶん","jornal","item"],
 ["はな","flor","item"],
 ["ねこ","gato","animal"],["いぬ","cachorro","animal"],["とり","pássaro","animal"],["うま","cavalo","animal"],["うし","vaca","animal"],
 ["がっこう","escola","lugar"],["えき","estação","lugar"],["こうえん","parque","lugar"],["うみ","mar","lugar"],["やま","montanha","lugar"]
];
function genKana(){
  const all=KANA_NOUNS;
  const items=KANA_NOUNS.filter(n=>n[2]==="item");
  const animals=KANA_NOUNS.filter(n=>n[2]==="animal");
  const lugares=KANA_NOUNS.filter(n=>n[2]==="lugar");
  function g(jpf, ptf, kana, pt, pool){ pushQ("kana", jpf(kana), ptf(pt), pool.map(n=>ptf(n[1]))); }
  for(const [kana, pt, tipo] of KANA_NOUNS){
    // universais (fazem sentido com qualquer substantivo)
    g(k=>`これは ${k} です。`, p=>`Isto é ${p}.`, kana, pt, all);
    g(k=>`${k} が すきです。`, p=>`Gosto de ${p}.`, kana, pt, all);
    // específicas por tipo (frases coerentes + distratores do mesmo tipo)
    if(tipo==="item")   g(k=>`${k} を かいました。`, p=>`Comprei ${p}.`, kana, pt, items);
    if(tipo==="animal") g(k=>`${k} を みました。`,   p=>`Vi ${p}.`,      kana, pt, animals);
    if(tipo==="lugar")  g(k=>`${k} へ いきます。`, p=>`Vou para ${p}.`, kana, pt, lugares);
  }
}

/* =========================================================================================
   ANTÔNIMOS — frase com uma palavra → escolher o OPOSTO (em japonês)
   pares [A_kanji, A_pt, B_kanji, B_pt]
   ========================================================================================= */
const ANTON = [
 ["大きい","grande","小さい","pequeno"],["高い","alto/caro","低い","baixo"],["高い","caro","安い","barato"],
 ["新しい","novo","古い","velho"],["良い","bom","悪い","ruim"],["暑い","quente","寒い","frio"],
 ["難しい","difícil","易しい","fácil"],["長い","comprido","短い","curto"],["広い","amplo","狭い","estreito"],
 ["重い","pesado","軽い","leve"],["強い","forte","弱い","fraco"],["明るい","claro","暗い","escuro"],
 ["多い","muitos","少ない","poucos"],["速い","rápido","遅い","lento"],["近い","perto","遠い","longe"],
 ["上手","habilidoso","下手","inábil"],["好き","gostar","嫌い","detestar"],["元気","animado","病気","doente"],
 ["行く","ir","来る","vir"],["買う","comprar","売る","vender"],["開ける","abrir","閉める","fechar"],
 ["立つ","levantar","座る","sentar"],["入る","entrar","出る","sair"],["始まる","começar","終わる","terminar"],
 ["起きる","acordar","寝る","dormir"],["暑い","calor","涼しい","fresco"],["甘い","doce","辛い","picante"],
 ["太い","grosso","細い","fino"],["深い","profundo","浅い","raso"],["嬉しい","feliz","悲しい","triste"],
 ["右","direita","左","esquerda"],["上","em cima","下","embaixo"],["前","frente","後ろ","atrás"],
 ["朝","manhã","夜","noite"],["白い","branco","黒い","preto"],["静か","silencioso","賑やか","movimentado"],
 ["便利","conveniente","不便","inconveniente"],["簡単","fácil","難しい","difícil"]
];
function genAnton(){
  const all = [];
  ANTON.forEach(p=>{ all.push(p[0]); all.push(p[2]); });
  for(const [a,apt,b,bpt] of ANTON){
    pushQ("antonimo", `「${a}」（${apt}）の はんたいの いみの ことばは どれですか。`, b, all);
    pushQ("antonimo", `「${b}」（${bpt}）の はんたいの いみの ことばは どれですか。`, a, all);
  }
}

/* =========================================================================================
   NOVOS PORTÕES
   ========================================================================================= */
// CORES (色)
const CORES = [
 ["赤","あか","vermelho"],["青","あお","azul"],["黄色","きいろ","amarelo"],["緑","みどり","verde"],
 ["黒","くろ","preto"],["白","しろ","branco"],["茶色","ちゃいろ","marrom"],["紫","むらさき","roxo"],
 ["ピンク","ぴんく","rosa"],["オレンジ","おれんじ","laranja"],["灰色","はいいろ","cinza"],["水色","みずいろ","azul-claro"],
 ["金色","きんいろ","dourado"],["銀色","ぎんいろ","prateado"]
];
function genCores(){
  const pts = CORES.map(c=>c[2]); const reads = CORES.map(c=>c[1]); const words = CORES.map(c=>c[0]);
  for(const [w,r,pt] of CORES){
    pushQ("cor", `色「${w}」は ポルトガル語で どれですか。`, pt, pts);
    pushQ("cor", `「${pt}」を 日本語で 言うと どれですか。`, w, words);
    pushQ("cor", `色「${w}」の読み方はどれですか。`, r, reads);
  }
}
// EXPRESSÕES (表) — situação em pt → expressão japonesa
const EXPR = [
 ["いただきます","Você vai começar a comer."],["ごちそうさま","Você terminou de comer."],
 ["すみません","Você quer chamar a atenção de alguém / pedir desculpa."],["ありがとう","Alguém te ajudou e você agradece."],
 ["どういたしまして","Alguém te agradeceu e você responde."],["ごめんなさい","Você quer se desculpar por um erro."],
 ["おめでとう","Você quer parabenizar alguém."],["おだいじに","Alguém está doente e você deseja melhoras."],
 ["がんばって","Você quer dar força/encorajar alguém."],["かんぱい","Você faz um brinde antes de beber."],
 ["おつかれさま","Alguém terminou o trabalho e você reconhece o esforço."],["もしもし","Você atende ao telefone."],
 ["しつれいします","Você entra/sai de uma sala formalmente."],["よろしくおねがいします","Você pede que cuidem bem de você / fecha um pedido."]
];
function genExpr(){
  const exprs = EXPR.map(e=>e[0]);
  for(const [jp, sit] of EXPR){
    pushQ("expr", `Situação: ${sit} O que você diz?`, jp, exprs);
  }
}
// SAUDAÇÕES (挨)
const SAUD = [
 ["おはようございます","De manhã, ao cumprimentar alguém."],["こんにちは","Durante o dia/tarde, ao cumprimentar."],
 ["こんばんは","À noite, ao cumprimentar alguém."],["さようなら","Ao se despedir (adeus)."],
 ["またあした","Ao se despedir até o dia seguinte."],["おやすみなさい","Antes de dormir, à noite."],
 ["はじめまして","Ao conhecer alguém pela primeira vez."],["いってきます","Ao sair de casa."],
 ["いってらっしゃい","Resposta a quem está saindo de casa."],["ただいま","Ao chegar em casa."],
 ["おかえりなさい","Resposta a quem acabou de chegar em casa."]
];
function genSaud(){
  const sauds = SAUD.map(s=>s[0]);
  for(const [jp, sit] of SAUD){
    pushQ("saudacao", `Situação: ${sit} O que você diz?`, jp, sauds);
  }
}

/* =========================================================================================
   VARIADO — herda do data.js atual
   ========================================================================================= */
function inheritVariado(){
  try{
    const old = fs.readFileSync("data.js","utf8");
    const sandbox = { window:{} };
    const vm = require("vm");
    vm.runInNewContext(old, sandbox);
    const arr = sandbox.window.QUIZ_DATA||[];
    arr.filter(q=>q.c==="variado").forEach(q=>{
      if(!seenQ.has(q.q)){ seenQ.add(q.q); OUT.push({q:q.q,o:q.o,a:q.a,c:"variado"}); }
    });
  }catch(e){ console.warn("variado: não herdado:", e.message); }
}

/* ---------- executa ---------- */
// numero e cor ficam só nos flashcards (não geram questões de quiz)
genVerbs(); genAdj(); genKanji(); genKata(); genGram();
genContador(); genTempo(); genVocab(); genKana(); genAnton();
genExpr(); genSaud(); inheritVariado();

// reindexa
OUT.forEach((q,idx)=>{ q.i = idx; });
const ordered = OUT.map(q=>{ const o={i:q.i, q:q.q, o:q.o, a:q.a, c:q.c};
  if(q.f) o.f=q.f; if(q.w) o.w=q.w; if(q.m) o.m=q.m; if(q.r) o.r=q.r; // campos de layout
  return o; });

const CATS = {
 "vocab":"Vocabulário","verbo":"Verbos","adj":"Adjetivos","kanji":"Kanji","kata":"Katakana",
 "gram":"Partículas e gramática","contador":"Contadores","tempo":"Tempo e datas",
 "kana":"Kana (hira/kata)","antonimo":"Antônimos","variado":"Variados",
 "expr":"Expressões","saudacao":"Saudações"
};

const out = "window.QUIZ_CATS="+JSON.stringify(CATS)+";\nwindow.QUIZ_DATA="+JSON.stringify(ordered)+";\n";
fs.writeFileSync("data.js", out, "utf8");

// relatório
const byc={}; ordered.forEach(q=>byc[q.c]=(byc[q.c]||0)+1);
console.log("TOTAL:", ordered.length);
console.log(JSON.stringify(byc,null,0));
