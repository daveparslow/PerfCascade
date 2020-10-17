import * as React from 'react';
import * as ReactDom from 'react-dom';
import { sanitizeUrlForLink } from '../../helpers/parse';
import { WaterfallEntryTab } from '../../typing/waterfall';

interface ITitleProps {
  sequenceNumber: number;
  title?: string;
}

interface IHeaderProps {
  title: ITitleProps;
  className: string;
  detailsHeight: number;
  tabs: WaterfallEntryTab[];
}

export function Header(props: IHeaderProps): JSX.Element {
  const { detailsHeight, tabs, title, className } = props;

  return (
    <>
      <header className={className}>
        <h3>
          <Title {...title}></Title>
        </h3>
        <nav className="tab-nav">
          <ul>
            {tabs.map(tab => (
              <li key={tab.title}>
                <button className="tab-button">{tab.title}</button>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      {tabs.map(tab => {
        if (typeof tab.renderTab === 'function') {
          return (
            <div key={tab.title} className={`tab ${tab.tabClass}`}>
              {tab.renderTab(detailsHeight)}
            </div>
          );
        }

        return null;
      })}
    </>
  );
}

export function Title(props: React.PropsWithChildren<ITitleProps>): JSX.Element {
  const { title } = props;
  const titleElement =
    title && title.startsWith('http') ? <a href={sanitizeUrlForLink(title)}>{title}</a> : title;

  return (
    <>
      <strong>#{props.sequenceNumber}</strong> {titleElement}
    </>
  );
}

export function renderDetails(props: IHeaderProps, root: HTMLElement): void {
  ReactDom.render(<Header {...props}></Header>, root);
}

export default Title;
