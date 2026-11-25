// Hand-annotated from synthetic source documents, without a model or ARCH-001 outcomes.
const booking = `Przepływ Rezerwacja [booking] w planetarium.
Efekt [seat]: przypisanie miejsca do rezerwacji.
Efekt [receipt]: wysłanie potwierdzenia pocztą.
To samo polecenie rezerwacji może dotrzeć wielokrotnie i ponowić próbę przypisania miejsca.
Każda rezerwacja [booking] ma zmienić przypisanie miejsca [seat] tylko raz, również przy ponowieniu polecenia.
Transport powiadomień zapewnia exactly-once na kolejce.
Wersja plakatu na wystawę pozostaje niezmieniona.`;
const decisions = `Rezerwacja [booking]: miejsce [seat] ma być przypisane dokładnie raz; ponowienie polecenia nie może przypisać go ponownie.
Konsument atomowo zapisuje klucz idempotentności wraz z przypisaniem miejsca [seat].
Deduplikacja wysyłki potwierdzeń [receipt] jest dopiero w planie.
Konsument poczty obecnie nie deduplikuje wysyłki potwierdzeń [receipt].`;

const returns = `Przepływ Zwrot eksponatu [return].
Efekt [inventory]: powiększenie stanu magazynowego.
Przepływ Zgłoszenie [ticket].
Efekt [ack]: wysłanie potwierdzenia zgłoszenia.
Powtórne przyjęcie komunikatu zwrotu zwiększyło stan magazynowy drugi raz [inventory]; incydent jest nadal otwarty.`;
const incidents = `W zeszłym roku ponowiona wiadomość Zgłoszenia wywołała drugą wysyłkę potwierdzenia [ack].
Powtórka komunikatu Zgłoszenia w innym incydencie wysłała kolejne potwierdzenie [ack]; ten incydent zamknięto po naprawie.
Ponowne dostarczenie komunikatu Zgłoszenia wywołało dodatkowe potwierdzenie [ack]; nie ustalono, czy incydent nadal trwa.
Nie wiadomo, czy rejestr zgłoszeń blokuje powtórną wysyłkę [ack].
Powiększenie stanu magazynowego [inventory] ma być idempotentne: ponowienie zwrotu nie może go zwiększyć drugi raz.`;

const hld = quote => ({documentId:'HLD', documentVersion:'1.0', quote});
const adr = quote => ({documentId:'ADR', documentVersion:'2.0', quote});
const documents = (hldText, adrText) => [
  {id:'HLD', version:'1.0', text:hldText}, {id:'ADR', version:'2.0', text:adrText}
];
const claim = (flowId, effectId, kind, status, source, incidentState = null) =>
  ({flowId, effectId, kind, status, incidentState, evidence:Array.isArray(source) ? source : [source]});

export const extractionGold = [
  {
    id:'planetarium', documents:documents(booking, decisions),
    gold:{
      flows:[{id:'booking', ...hld('Przepływ Rezerwacja [booking] w planetarium.')}],
      effects:[
        {id:'seat', flowId:'booking', ...hld('Efekt [seat]: przypisanie miejsca do rezerwacji.')},
        {id:'receipt', flowId:'booking', ...hld('Efekt [receipt]: wysłanie potwierdzenia pocztą.')}
      ],
      claims:[
        claim('booking', 'seat', 'possible_duplicate_delivery', 'existing',
          hld('To samo polecenie rezerwacji może dotrzeć wielokrotnie i ponowić próbę przypisania miejsca.')),
        claim('booking', 'seat', 'exactly_once_requirement', 'existing', [
          adr('miejsce [seat] ma być przypisane dokładnie raz; ponowienie polecenia nie może przypisać go ponownie'),
          hld('Każda rezerwacja [booking] ma zmienić przypisanie miejsca [seat] tylko raz, również przy ponowieniu polecenia')
        ]),
        claim('booking', 'seat', 'protection_documented', 'existing',
          adr('Konsument atomowo zapisuje klucz idempotentności wraz z przypisaniem miejsca [seat].')),
        claim('booking', 'receipt', 'protection_documented', 'planned',
          adr('Deduplikacja wysyłki potwierdzeń [receipt] jest dopiero w planie.')),
        claim('booking', 'receipt', 'protection_documented', 'negated',
          adr('Konsument poczty obecnie nie deduplikuje wysyłki potwierdzeń [receipt].'))
      ]
    }
  },
  {
    id:'museum-incidents', documents:documents(returns, incidents),
    gold:{
      flows:[
        {id:'return', ...hld('Przepływ Zwrot eksponatu [return].')},
        {id:'ticket', ...hld('Przepływ Zgłoszenie [ticket].')}
      ],
      effects:[
        {id:'inventory', flowId:'return', ...hld('Efekt [inventory]: powiększenie stanu magazynowego.')},
        {id:'ack', flowId:'ticket', ...hld('Efekt [ack]: wysłanie potwierdzenia zgłoszenia.')}
      ],
      claims:[
        claim('return', 'inventory', 'duplicate_business_effect', 'existing',
          hld('Powtórne przyjęcie komunikatu zwrotu zwiększyło stan magazynowy drugi raz [inventory]; incydent jest nadal otwarty.'), 'current_unresolved'),
        claim('ticket', 'ack', 'duplicate_business_effect', 'existing',
          adr('W zeszłym roku ponowiona wiadomość Zgłoszenia wywołała drugą wysyłkę potwierdzenia [ack].'), 'historical'),
        claim('ticket', 'ack', 'duplicate_business_effect', 'existing',
          adr('Powtórka komunikatu Zgłoszenia w innym incydencie wysłała kolejne potwierdzenie [ack]; ten incydent zamknięto po naprawie.'), 'resolved'),
        claim('ticket', 'ack', 'duplicate_business_effect', 'existing',
          adr('Ponowne dostarczenie komunikatu Zgłoszenia wywołało dodatkowe potwierdzenie [ack]; nie ustalono, czy incydent nadal trwa.'), 'unclear'),
        claim('ticket', 'ack', 'protection_documented', 'unclear',
          adr('Nie wiadomo, czy rejestr zgłoszeń blokuje powtórną wysyłkę [ack].')),
        claim('return', 'inventory', 'exactly_once_requirement', 'existing',
          adr('Powiększenie stanu magazynowego [inventory] ma być idempotentne: ponowienie zwrotu nie może go zwiększyć drugi raz.'))
      ]
    }
  },
  {
    id:'transport-only', documents:documents(
      'Węzeł testowy wymienia komunikaty kontrolne. Broker testowy deklaruje exactly-once w transporcie.',
      'Decyzja dotyczy wyłącznie formatu technicznych komunikatów kontrolnych, bez opisu przepływu biznesowego.'
    ),
    gold:{flows:[], effects:[], claims:[]}
  }
];
